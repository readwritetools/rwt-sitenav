//=============================================================================
//
// File:         /node_modules/rwt-sitenav/rwt-sitenav.js
// Language:     ECMAScript 2015
// Copyright:    Read Write Tools © 2019
// License:      MIT
// Initial date: Nov 18, 2019
// Purpose:      Popout site navigation panel
//
//=============================================================================

const Static = {
	componentName:    'rwt-sitenav',
	elementInstance:  1,
	htmlURL:          '/node_modules/rwt-sitenav/rwt-sitenav.blue',
	cssURL:           '/node_modules/rwt-sitenav/rwt-sitenav.css',
	htmlText:         null,
	cssText:          null
};

Object.seal(Static);

export default class RwtSitenav extends HTMLElement {

	constructor() {
		super();
		
		// guardrails
		this.instance = Static.elementInstance++;
		this.isComponentLoaded = false;

		// properties
		this.collapseSender = `${Static.componentName} ${this.instance}`;
		this.shortcutKey = null;

		// child elements
		this.nav = null;
		this.pullOutButton = null;
		this.pullOutOverlay = null;

		// touch interface for swipe left/right
		this.swipe1 = null;
		this.swipe2 = null;

		// select and scroll to this document's menu item
		this.activeElement = null;
		this.hrefLevel1 = '';
		this.hrefLevel2 = '';
		this.hrefLevel3 = '';
		
		Object.seal(this);
	}
	
	//-------------------------------------------------------------------------
	// customElement life cycle callback
	//-------------------------------------------------------------------------
	async connectedCallback() {		
		if (!this.isConnected)
			return;
		
		try {
			var htmlFragment = await this.getHtmlFragment();
			var styleElement = await this.getCssStyleElement();

			var menuElement = await this.fetchMenu();
			if (menuElement != null) {
				var elNav = htmlFragment.getElementById('nav');
				elNav.appendChild(menuElement);
			}

			this.attachShadow({mode: 'open'});
			this.shadowRoot.appendChild(htmlFragment); 
			this.shadowRoot.appendChild(styleElement); 
			
			this.identifyChildren();
			this.registerEventListeners();
			this.initializeShortcutKey();
			this.enableTouchSwipes();
			this.selectAndScrollActiveElement();
			this.pulsate();
			this.sendComponentLoaded();
		}
		catch (err) {
			console.log(err.message);
		}
	}
	
	//-------------------------------------------------------------------------
	// initialization
	//-------------------------------------------------------------------------

	// Only the first instance of this component fetches the HTML text from the server.
	// All other instances wait for it to issue an 'html-template-ready' event.
	// If this function is called when the first instance is still pending,
	// it must wait upon receipt of the 'html-template-ready' event.
	// If this function is called after the first instance has already fetched the HTML text,
	// it will immediately issue its own 'html-template-ready' event.
	// When the event is received, create an HTMLTemplateElement from the fetched HTML text,
	// and resolve the promise with a DocumentFragment.
	getHtmlFragment() {
		return new Promise(async (resolve, reject) => {
			var htmlTemplateReady = `${Static.componentName}-html-template-ready`;
			
			document.addEventListener(htmlTemplateReady, () => {
				var template = document.createElement('template');
				template.innerHTML = Static.htmlText;
				resolve(template.content);
			});
			
			if (this.instance == 1) {
				var response = await fetch(Static.htmlURL, {cache: "no-cache", referrerPolicy: 'no-referrer'});
				if (response.status != 200 && response.status != 304) {
					reject(new Error(`Request for ${Static.htmlURL} returned with ${response.status}`));
					return;
				}
				Static.htmlText = await response.text();
				document.dispatchEvent(new Event(htmlTemplateReady));
			}
			else if (Static.htmlText != null) {
				document.dispatchEvent(new Event(htmlTemplateReady));
			}
		});
	}
	
	// Use the same pattern to fetch the CSS text from the server
	// When the 'css-text-ready' event is received, create an HTMLStyleElement from the fetched CSS text,
	// and resolve the promise with that element.
	getCssStyleElement() {
		return new Promise(async (resolve, reject) => {
			var cssTextReady = `${Static.componentName}-css-text-ready`;

			document.addEventListener(cssTextReady, () => {
				var styleElement = document.createElement('style');
				styleElement.innerHTML = Static.cssText;
				resolve(styleElement);
			});
			
			if (this.instance == 1) {
				var response = await fetch(Static.cssURL, {cache: "no-cache", referrerPolicy: 'no-referrer'});
				if (response.status != 200 && response.status != 304) {
					reject(new Error(`Request for ${Static.cssURL} returned with ${response.status}`));
					return;
				}
				Static.cssText = await response.text();
				document.dispatchEvent(new Event(cssTextReady));
			}
			else if (Static.cssText != null) {
				document.dispatchEvent(new Event(cssTextReady));
			}
		});
	}

	//^ Fetch the user-specified menu items from the file specified in
	//  the custom element's sourceref attribute, which is a URL.
	//
	//  That file should contain HTML with <h2> and <li> items like this:
	//	  <h2><a href='/basics.blue' tabindex=301>Basics</a></h2>
	//    <ul>
	//       <li><a href='/basics/shorthand-notation-for-writers.blue' tabindex=301 title='Distraction-free authoring with smart tech for people who type'>Shorthand Notation</a></li>
	//    </ul>
	//
	//< returns a document-fragment suitable for appending to the nav element
	//< returns null if the user has not specified a sourceref attribute or
	//  if the server does not respond with 200 or 304
	async fetchMenu() {
		if (this.hasAttribute('sourceref') == false)
			return null;
		
		var sourceref = this.getAttribute('sourceref');

		var response = await fetch(sourceref, {cache: "no-cache", referrerPolicy: 'no-referrer'});		// send conditional request to server with ETag and If-None-Match
		if (response.status != 200 && response.status != 304)
			return null;
		var templateText = await response.text();
		
		// create a template and turn its content into a document fragment
		var template = document.createElement('template');
		template.innerHTML = templateText;
		return template.content;
	}

	//^ Identify this component's children
	identifyChildren() {
		this.nav = this.shadowRoot.getElementById('nav');
		this.pullOutButton = this.shadowRoot.getElementById('pull-out-button');
		this.pullOutOverlay = this.shadowRoot.getElementById('pull-out-overlay');		
	}		

	registerEventListeners() {
		// document events
		document.addEventListener('click', this.onClickDocument.bind(this));
		document.addEventListener('keydown', this.onKeydownDocument.bind(this));
		document.addEventListener('collapse-popup', this.onCollapsePopup.bind(this));
		document.addEventListener('toggle-sitenav', this.onToggleEvent.bind(this));
		
		// component events
		this.nav.addEventListener('click', this.onClickNav.bind(this));
		this.pullOutButton.addEventListener('click', this.onClickPullOutButton.bind(this));
	}

	//^ Get the user-specified shortcut key. This will be used to open the dialog.
	//  Valid values are "F1", "F2", etc., specified with the *shortcut attribute on the custom element
	initializeShortcutKey() {
		if (this.hasAttribute('shortcut'))
			this.shortcutKey = this.getAttribute('shortcut');
	}

	// Register swipe left and swipe right as toggleMenu initiators
	enableTouchSwipes() {
		var boundToggleMenu = this.toggleMenu.bind(this);
		this.swipe1 = new Swipe(this.nav, null, boundToggleMenu, null, boundToggleMenu);
		this.swipe2 = new Swipe(this.pullOutOverlay, null, boundToggleMenu, null, boundToggleMenu);		
	}

	//^ Select and scroll into view the entry corresponding to this document
	//
	//  For this to work, the document should have one or more of these tags in its <head>
	//    <meta name=sitenav:level1 content='/file1.blue' />
	//    <meta name=sitenav:level2 content='/dir1/file2.blue' />
	//    <meta name=sitenav:level3 content='/dir1/dir2/file3.blue' />
	//
	selectAndScrollActiveElement() {
		// get level1, level2, and level3 values from the document's <meta> elements
		var meta = document.querySelector('meta[name="sitenav:level1"]')
		if (meta != null) {
			this.hrefLevel1 = meta.getAttribute('content');
			if (this.hrefLevel1 == null)
				this.hrefLevel1 = '';
		}
		meta = document.querySelector('meta[name="sitenav:level2"]')
		if (meta != null) {
			this.hrefLevel2 = meta.getAttribute('content');
			if (this.hrefLevel2 == null)
				this.hrefLevel2 = '';
		}
		meta = document.querySelector('meta[name="sitenav:level3"]')
		if (meta != null) {
			this.hrefLevel3 = meta.getAttribute('content');
			if (this.hrefLevel3 == null)
				this.hrefLevel3 = '';
		}
		
		if (this.activeElement == null && this.hrefLevel3 != '') {
			var anchorLevel3 = `a[href='${this.hrefLevel3}']`;							//  /semantax/action/area.blue
			this.activeElement = this.nav.querySelector(anchorLevel3);					//  for elements added to shadow DOM
			if (this.activeElement == null)
				this.activeElement = this.querySelector(anchorLevel3);					//  for elements added as slot
		}
		if (this.activeElement == null && this.hrefLevel2 != '') {
			var anchorLevel2 = `a[href='${this.hrefLevel2}']`;							//  /semantax/action.blue
			this.activeElement = this.nav.querySelector(anchorLevel2);					//  for elements added to shadow DOM
			if (this.activeElement == null)
				this.activeElement = this.querySelector(anchorLevel2);					//  for elements added as slot
		}
		if (this.activeElement == null && this.hrefLevel1 != '') {
			var anchorLevel1 = `a[href='${this.hrefLevel1}']`;							//  /semantax.blue
			this.activeElement = this.nav.querySelector(anchorLevel1);					//  for elements added to shadow DOM
			if (this.activeElement == null)
				this.activeElement = this.querySelector(anchorLevel1);					//  for elements added as slot
		}
		if (this.activeElement) {
			this.activeElement.scrollIntoView({block:'center'});
			this.activeElement.classList.add('activename');								//  use CSS to add ◀  xxx ►
		}
	}

	//^ Draw attention to the pull-out nav for newcomers
	pulsate() {
		var b = false;
		// if the user has never been to this website before
		if (localStorage.getItem('rwt-sitenav-pulsate') == null) {
			localStorage.setItem('rwt-sitenav-pulsate', 1);
			b = true;
		}
		// else the user has been to this website before
		else {
			var numVisits = parseInt(localStorage.getItem('rwt-sitenav-pulsate')) + 1;
			localStorage.setItem('rwt-sitenav-pulsate', numVisits);
			if (numVisits <= 4)
				b = true;
		}
		if (b)
			this.pullOutOverlay.classList.add('pulsate');
	}
	
	//^ Inform the document's custom element that it is ready for programmatic use 
	sendComponentLoaded() {
		this.isComponentLoaded = true;
		this.dispatchEvent(new Event('component-loaded', {bubbles: true}));
	}

	//^ A Promise that resolves when the component is loaded
	waitOnLoading() {
		return new Promise((resolve) => {
			if (this.isComponentLoaded == true)
				resolve();
			else
				this.addEventListener('component-loaded', resolve);
		});
	}
	
	//-------------------------------------------------------------------------
	// document events
	//-------------------------------------------------------------------------
	
	// User has clicked on the document
	onClickDocument(event) {
		this.hideMenu();
		event.stopPropagation();
	}

	// close the dialog when user presses the ESC key
	// toggle the dialog when user presses the assigned shortcutKey
	onKeydownDocument(event) {		
		if (event.key == "Escape") {
			this.hideMenu();
			event.stopPropagation();
		}
		// like 'F1', 'F2', etc
		if (event.key == this.shortcutKey && this.shortcutKey != null) {
			this.toggleMenu(event);
			event.stopPropagation();
			event.preventDefault();
		}
	}

	//^ Send an event to close/hide all other registered popups
	collapseOtherPopups() {
		var collapseEvent = new CustomEvent('collapse-popup', {detail: this.collapseSender});
		document.dispatchEvent(collapseEvent);
	}
	
	//^ Listen for an event on the document instructing this component to close/hide
	//  But don't collapse this component, if it was the one that generated it
	onCollapsePopup(event) {
		if (event.detail == this.collapseSender)
			return;
		else
			this.hideMenu();
	}
	
	//^ Anybody can use: document.dispatchEvent(new Event('toggle-sitenav'));
	// to open/close this component.
	onToggleEvent(event) {
		event.stopPropagation();
		this.toggleMenu(event);
	}
	
	//-------------------------------------------------------------------------
	// component events
	//-------------------------------------------------------------------------

	// User has clicked in the nav panel, but not on a button
	onClickNav(event) {
		event.stopPropagation();
	}

	onClickPullOutButton(event) {
		this.toggleMenu(event);
	}
	
	//-------------------------------------------------------------------------
	// component methods
	//-------------------------------------------------------------------------
	
	// open/close
	toggleMenu(event) {
		if (this.nav.className == 'hide-menu')
			this.showMenu();
		else
			this.hideMenu();
		event.stopPropagation();
	}

	showMenu() {
		this.collapseOtherPopups();
		this.nav.className = 'show-menu';
		this.pullOutButton.className = 'show-menu';
		this.pullOutOverlay.className = 'show-menu';
		
		if (this.activeElement != null)
			this.activeElement.focus();
	}

	hideMenu() {
		this.nav.className = 'hide-menu';
		this.pullOutButton.className = 'hide-menu';
		this.pullOutOverlay.className = '';	
	}
}

// Touch interface for swipe left/right
class Swipe {

	constructor(elementOrSelector, onSwipeUp, onSwipeRight, onSwipeDown, onSwipeLeft) {

		this.element = typeof(elementOrSelector) === 'string' ? document.querySelector(elementOrSelector) : elementOrSelector;
		this.onSwipeUp		= (onSwipeUp)		? onSwipeUp		: this.unhandledSwipe;
		this.onSwipeRight	= (onSwipeRight)	? onSwipeRight	: this.unhandledSwipe;
		this.onSwipeDown	= (onSwipeDown)		? onSwipeDown	: this.unhandledSwipe;
		this.onSwipeLeft	= (onSwipeLeft)		? onSwipeLeft	: this.unhandledSwipe;

		this.xBegin = null;
		this.yBegin = null;

		this.initializeListeners();
		Object.seal();
	}

	initializeListeners() {
		this.element.addEventListener('touchstart', this.onTouchStart.bind(this), {passive: false});	// https://github.com/WICG/EventListenerOptions/blob/gh-pages/explainer.md
		this.element.addEventListener('touchmove', this.onTouchMove.bind(this), {passive: false});		// https://github.com/WICG/EventListenerOptions/blob/gh-pages/explainer.md
	}

	onTouchStart(event) {
		this.xBegin = event.touches[0].clientX;
		this.yBegin = event.touches[0].clientY;
	}

	onTouchMove(event) {
		if (this.xBegin == null || this.yBegin == null)
			return;

		var xEnd = event.touches[0].clientX;
		var yEnd = event.touches[0].clientY;

		this.xDiff = this.xBegin - xEnd;
		this.yDiff = this.yBegin - yEnd;

		if (Math.abs(this.xDiff) > Math.abs(this.yDiff)) {
			if (this.xDiff > 0)
				this.onSwipeLeft();
			else
				this.onSwipeRight();
		} else {
			if (this.yDiff > 0)
				this.onSwipeUp();
			else
				this.onSwipeDown();
		}
		this.xBegin = null;
		this.yBegin = null;
	}

	unhandledSwipe() {
		return null;
	}
}

window.customElements.define(Static.componentName, RwtSitenav);
