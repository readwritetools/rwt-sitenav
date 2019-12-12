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

export default class RwtSitenav extends HTMLElement {

	constructor() {
		super();
		
		// child elements
		this.nav = null;
		this.pullOutButton = null;
		this.pullOutOverlay = null;

		// properties
		this.shortcutKey = null;

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
	// customElement life cycle callbacks
	//-------------------------------------------------------------------------
	async connectedCallback() {		
		// guard against possible call after this has been disconnected
		if (!this.isConnected)
			return;
		
		var htmlFragment = await this.fetchTemplate();
		if (htmlFragment == null)
			return;
		
		var styleElement = await this.fetchCSS();
		if (styleElement == null)
			return;

		var menuElement = await this.fetchMenu();
		if (menuElement != null) {
			var elNav = htmlFragment.getElementById('nav');
			elNav.appendChild(menuElement);
		}
		
		// append the HTML and CSS to the custom element's shadow root
		this.attachShadow({mode: 'open'});
		this.shadowRoot.appendChild(htmlFragment); 
		this.shadowRoot.appendChild(styleElement); 
		
		this.identifyChildren();
		this.registerEventListeners();
		this.initializeShortcutKey();
		this.enableTouchSwipes();
		this.selectAndScrollActiveElement();
	}
	
	//-------------------------------------------------------------------------
	// initialization
	//-------------------------------------------------------------------------

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

		var response = await fetch(sourceref, {cache: "no-cache"});		// send conditional request to server with ETag and If-None-Match
		if (response.status != 200 && response.status != 304)
			return null;
		var templateText = await response.text();
		
		// create a template and turn its content into a document fragment
		var template = document.createElement('template');
		template.innerHTML = templateText;
		return template.content;
	}

	//^ Fetch the HTML template
	//< returns a document-fragment suitable for appending to shadowRoot
	//< returns null if server does not respond with 200 or 304
	async fetchTemplate() {
		var response = await fetch('/node_modules/rwt-sitenav/rwt-sitenav.blue');
		if (response.status != 200 && response.status != 304)
			return null;
		var templateText = await response.text();
		
		// create a template and turn its content into a document fragment
		var template = document.createElement('template');
		template.innerHTML = templateText;
		return template.content;
	}
	
	//^ Fetch the CSS styles and turn it into a style element
	//< returns an style element suitable for appending to shadowRoot
	//< returns null if server does not respond with 200 or 304
	async fetchCSS() {
		var response = await fetch('/node_modules/rwt-sitenav/rwt-sitenav.css');
		if (response.status != 200 && response.status != 304)
			return null;
		var css = await response.text();

		var styleElement = document.createElement('style');
		styleElement.innerHTML = css;
		return styleElement;
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
	//  Default value is "F9"
	initializeShortcutKey() {
		if (this.hasAttribute('shortcut'))
			this.shortcutKey = this.getAttribute('shortcut');
		else
			this.shortcutKey = 'F9';
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
			this.activeElement = this.nav.querySelector(anchorLevel3);
			
			if (this.activeElement == null) {
				anchorLevel3 = `::slotted(a[href='${this.hrefLevel3}'])`;
				this.activeElement = this.nav.querySelector(anchorLevel3);
			}
		}
		if (this.activeElement == null && this.hrefLevel2 != '') {
			var anchorLevel2 = `a[href='${this.hrefLevel2}']`;							//  /semantax/action.blue
			this.activeElement = this.nav.querySelector(anchorLevel2);
			
			if (this.activeElement == null) {
				anchorLevel2 = `::slotted(a[href='${this.hrefLevel2}'])`;
				this.activeElement = this.nav.querySelector(anchorLevel2);
			}
		}
		if (this.activeElement == null && this.hrefLevel1 != '') {
			var anchorLevel1 = `a[href='${this.hrefLevel1}']`;							//  /semantax.blue
			this.activeElement = this.nav.querySelector(anchorLevel1);
			
			if (this.activeElement == null) {
				anchorLevel1 = `::slotted(a[href='${this.hrefLevel1}'])`;
				this.activeElement = this.nav.querySelector(anchorLevel1);
			}
		}
		if (this.activeElement) {
			this.activeElement.scrollIntoView({block:'center'});
			this.activeElement.classList.add('activename');								// use CSS to add ◀  xxx ►
		}
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
		if (event.key == this.shortcutKey) {
			this.toggleMenu(event);
			event.stopPropagation();
			event.preventDefault();
		}
	}

	//^ Send an event to close/hide all other registered popups
	collapseOtherPopups() {
		var collapseEvent = new CustomEvent('collapse-popup', {detail: { sender: 'RwtSitenav'}});
		document.dispatchEvent(collapseEvent);
	}
	
	//^ Listen for an event on the document instructing this component to close/hide
	//  But don't collapse this component, if it was the one that generated it
	onCollapsePopup(event) {
		if (event.detail.sender == 'RwtSitenav')
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
		this.element.addEventListener('touchstart', this.onTouchStart.bind(this), false);
		this.element.addEventListener('touchmove', this.onTouchMove.bind(this), false);
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

window.customElements.define('rwt-sitenav', RwtSitenav);
