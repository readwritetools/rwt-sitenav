











<figure>
	<img src='/img/components/sitenav/sitenav-unsplash-marjanblan.jpg' width='100%' />
	<figcaption></figcaption>
</figure>

##### Open Source DOM Component

# Sitenav

## Website pull-out navigation


<address>
<img src='/img/48x48/rwtools.png' /> by <a href='https://readwritetools.com' title='Read Write Tools'>Read Write Tools</a> <time datetime=2019-12-10>Dec 10, 2019</time></address>



<table>
	<tr><th>Abstract</th></tr>
	<tr><td>The <span class=product>rwt-sitenav</span> DOM component is a pull-out website navigation menu, with subtle hamburger button, and default activation of the menu item for the current page.</td></tr>
</table>

### Motivation

Sometimes you need to provide your website visitors with quick access to a large
quantity of pages without cluttering the main reading area of the page.

The <span>rwt-sitenav</span> DOM component does this by keeping the menu
off the left-hand side of the page until the user needs it. The menu is
activated, sliding over the page content, when the user clicks on the hamburger
menu button. Activation may also be initiated through the component's `toggleMenu`
method or through its event interface.

The component has these features:

   * The hamburger menu button is subtly displayed along the left-hand margin,
      appearing brighter on hover.
   * The first few times that a visitor interacts with your website, the menu button
      pulses to draw attention to itself.
   * The menu scrolls vertically, accommodating any number of menu items.
   * Menu items may be kept separate from the DOM component, allowing the webmaster
      to change its contents in a single centralized place. Alternatively, menu items
      may be slotted directly between the component's opening and closing tags.
   * The menu item corresponding to the current page is highlighted and scrolled into
      view when the page is first loaded.
   * The menu has an event interface for showing and hiding itself.
   * The menu emits a custom event to close sibling menus and dialog boxes.
   * A keyboard listener is provided to allow a shortcut key to open/close the menu.

#### In the wild

To see an example of this component in use, visit the <a href='https://fiddle.blue/'><span class=bp>BLUE</span><span class=phrase>FIDDLE</span></a>
website and press <kbd>F1</kbd> "Menu". To understand what's going on under the
hood, use the browser's inspector to view the HTML source code and network
activity, and follow along as you read this documentation.

#### Prerequisites

The <span>rwt-sitenav</span> DOM component works in any browser that
supports modern W3C standards. Templates are written using <span>BLUE</span><span>
PHRASE</span> notation, which can be compiled into HTML using the free <a href='https://hub.readwritetools.com/desktop/rwview.blue'>Read Write View</a>
desktop app. It has no other prerequisites. Distribution and installation are
done with either NPM or via Github.

#### Installation using NPM

If you are familiar with Node.js and the `package.json` file, you'll be
comfortable installing the component just using this command:

```bash
npm install rwt-sitenav
```

If you are a front-end Web developer with no prior experience with NPM, follow
these general steps:

   * Install <a href='https://nodejs.org'>Node.js/NPM</a>
on your development computer.
   * Create a `package.json` file in the root of your web project using the command:
```bash
npm init
```

   * Download and install the DOM component using the command:
```bash
npm install rwt-sitenav
```


Important note: This DOM component uses Node.js and NPM and `package.json` as a
convenient *distribution and installation* mechanism. The DOM component itself
does not need them.

#### Installation using Github

If you are more comfortable using Github for installation, follow these steps:

   * Create a directory `node_modules` in the root of your web project.
   * Clone the <span>rwt-sitenav</span> DOM component into it using the
      command:
```bash
git clone https://github.com/readwritetools/rwt-sitenav.git
```


### Using the DOM component

After installation, you need to add two things to your HTML page to make use of
it.

   * Add a `script` tag to load the component's `rwt-sitenav.js` file:
```html
<script src='/node_modules/rwt-sitenav/rwt-sitenav.js' type=module></script>             
```

   * Add the component tag somewhere on the page.

      * For scripting purposes, apply an `id` attribute.
      * Apply a `sourceref` attribute with a reference to an HTML file containing the
         menu's text and any CSS it needs.
      * Optionally, apply a `shortcut` attribute with something like `F9`, `F10`, etc. for
         hotkey access.
      * For WAI-ARIA accessibility apply a `role=navigation` attribute.
      * For simple menus, the `sourceref` may be omitted and the menu hyperlinks may be
         slotted into the DOM component. Simply place the hyperlinks directly between the
`<rwt-sitenav>` and `</rwt-sitenav>` tags.
```html
<rwt-sitenav id=sitenav sourceref='/menu.html' shortcut=F9 role=navigation></rwt-sitenav>
```


#### Menu template

The content and format of the menu is not prescribed. You may add hyperlinks
with formatting that matches your website. Still, one important guideline to
keep in mind is that the text of each menu item should be short so that it
doesn't wrap into multiple lines. If necessary, the width of the panel can be
adjusted using the component's `--width` CSS variable.

The easiest way to start building your menu is to follow this pattern, which
uses list items `li` for individual pages, and headings `h2` for grouping similar
pages.

```html
<h2><a href='/products.html' >Products</a></h2>
<ul>
    <li><a href='/products/grappling-hooks.html'>Grappling hooks</a></li>
    <li><a href='/products/ropes.html'>Ropes</a></li>
    <li><a href='/products/carabiners.html'>Carabiners</a></li>
</ul>
<h2><a href='/services.html' >Services</a></h2>
<ul>
    <li><a href='/services/training.html'>Training</a></li>
    <li><a href='/services/certification.html'>Certification</a></li>
</ul>
```

#### Self identification

The menu item corresponding to the current page can be highlighted when it
identifies itself to the menu. This is accomplished by adding a `meta` tag to the
page that contains the short-form URL of the page itself. For example, if the
page's full URL is `https://example.com:443/services.html` the shortform URL would
be `/services.html`.

The short-form URL may be added to any of three special-purpose `meta` tags, like
this:

```html
<meta name=sitenav:level1 content='/services.html' />
<meta name=sitenav:level2 content='/services/certification.html' />
<meta name=sitenav:level3 content='/services/certification/instructor.html' />
```

The three items correspond to the artificial hierarchical depth of the menu
items. When the page is first loaded, the DOM component uses the content
attribute of these meta tags as search terms, looking for the menu item with a
matching anchor `href`. When found, that menu item is highlighted and scrolled
into view.

The search for a corresponding `href` is conducted starting with the deepest
level, going from `sitenav:level3` to `sitenav:level2` to `sitenav:level1`.

Continuing with the previous example, if the current page is `https://example.com:443/services.html`
, then this menu item will be highlighted:

```html
<h2><a href='/services.html' >Services</a></h2>
```

### Customization

#### Menu size and position

When visible, the menu is absolutely positioned along the left-hand side of the
viewport. Its position and size may be overridden using CSS by defining new
values for the top, bottom, and width variables.

```css
rwt-sitenav {
    --top: 0;
    --bottom: 0;
    --width: 15.5rem;
    --z-index: 1;
}
```

#### Menu color scheme

The default color palette for the menu uses a dark mode theme. You can use CSS
to override the variables' defaults:

```css
rwt-sitenav {
    --background: var(--nav-black);
    --level1-color: var(--title-blue);
    --level2-color: var(--pure-white);
    --accent-color: var(--yellow);
    --accent-background: var(--pure-black);
}
```

### Life-cycle events

The component issues life-cycle events.


<dl>
	<dt><code>component-loaded</code></dt>
	<dd>Sent when the component is fully loaded and ready to be used. As a convenience you can use the <code>waitOnLoading()</code> method which returns a promise that resolves when the <code>component-loaded</code> event is received. Call this asynchronously with <code>await</code>.</dd>
</dl>

### Event controllers

The menu can be controlled with its event interface.


<dl>
	<dt><code>toggle-sitenav</code></dt>
	<dd>The component listens on DOM <code>document</code> for <code>toggle-sitenav</code> messages. Upon receipt it will show or hide the menu.</dd>
	<dt><code>keydown</code></dt>
	<dd>The component listens on DOM <code>document</code> for <code>keydown</code> messages. If the user presses the configured shortcut key (<kbd>F9</kbd>, <kbd>F10</kbd>, etc) it will show/hide the menu. The <kbd>Esc</kbd> key hides the menu.</dd>
	<dt><code>collapse-popup</code></dt>
	<dd>The component listens on DOM <code>document</code> for <code>collapse-popup</code> messages, which are sent by sibling menus or dialog boxes. Upon receipt it will close itself.</dd>
	<dt><code>click</code></dt>
	<dd>The component listens on DOM <code>document</code> for <code>click</code> messages. When the user clicks anywhere outside the menu, it closes itself.</dd>
</dl>

---

### Reference


<table>
	<tr><td><img src='/img/48x48/read-write-hub.png' alt='DOM components logo' width=48 /></td>	<td>Documentation</td> 		<td><a href='https://hub.readwritetools.com/components/sitenav.blue'>READ WRITE HUB</a></td></tr>
	<tr><td><img src='/img/48x48/git.png' alt='git logo' width=48 /></td>	<td>Source code</td> 			<td><a href='https://github.com/readwritetools/rwt-sitenav'>github</a></td></tr>
	<tr><td><img src='/img/48x48/dom-components.png' alt='DOM components logo' width=48 /></td>	<td>Component catalog</td> 	<td><a href='https://domcomponents.com/components/sitenav.blue'>DOM COMPONENTS</a></td></tr>
	<tr><td><img src='/img/48x48/npm.png' alt='npm logo' width=48 /></td>	<td>Package installation</td> <td><a href='https://www.npmjs.com/package/rwt-sitenav'>npm</a></td></tr>
	<tr><td><img src='/img/48x48/read-write-stack.png' alt='Read Write Stack logo' width=48 /></td>	<td>Publication venue</td>	<td><a href='https://readwritestack.com/components/sitenav.blue'>READ WRITE STACK</a></td></tr>
</table>

### License

The <span>rwt-sitenav</span> DOM component is licensed under the MIT
License.

<img src='/img/blue-seal-mit.png' width=80 align=right />

<details>
	<summary>MIT License</summary>
	<p>Copyright © 2020 Read Write Tools.</p>
	<p>Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:</p>
	<p>The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.</p>
	<p>THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.</p>
</details>

