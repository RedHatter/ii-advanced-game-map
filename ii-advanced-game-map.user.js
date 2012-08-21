// ==UserScript==
// @name        ii-advanced-game-map
// @namespace   http://redhatter.gethub.com
// @description Adds note takeing and searching to the game map.
// @include     http://www.improbableisland.com/*
// @include     http://improbableisland.com/*
// @version     1
// ==/UserScript==

var FILTER = true;
var SCALE = 0.75;
var MARK_NOTES = true;

var radio;
var count;

var map = document.evaluate("//table[./tbody/tr/td/div/@id = 'maprow_40']", document, null, XPathResult.ANY_TYPE, null).iterateNext();
if(map)
{
	GM_setValue('map', '<table cellspacing="1" cellpadding="0" border="0">'+map.innerHTML+'</table>');

	var cell = document.evaluate("//a/@href[contains(.,'dir=north')]", document, null, XPathResult.ANY_TYPE, null).iterateNext().textContent;
	var contains = unescape(cell.slice(cell.indexOf('oloc=')+5,cell.indexOf('&dir')-4)).replace(',',', ');
	var current = document.evaluate("./tbody/tr/td[contains(@title,'"+contains+"')]", map, null, XPathResult.ANY_TYPE, null).iterateNext();
	current.style.backgroundColor = '#FF9900';

	var searchIn = document.createElement( 'input' )
	if (FILTER)
		searchIn.addEventListener("keyup", filterMap, false);
	else
		searchIn.addEventListener("change", filterMap, false);
	searchIn.setAttribute('placeholder', 'Filter');
	map.parentNode.insertBefore(searchIn, map);

	radio = document.createElement('input');
	radio.type = 'checkbox';
	map.parentNode.insertBefore(radio, map);
	map.parentNode.insertBefore(document.createTextNode(' Search descriptions '), map);

	count = document.createElement('span');
	map.parentNode.insertBefore(count, map);	

	var element = document.createElement( 'a' );
	element.addEventListener("click", function(){openView('')}, true);
	element.appendChild(document.createTextNode(' (View All) '));
	map.parentNode.insertBefore(element, map);

	element = document.createElement( 'a' );
	element.addEventListener("click", function()
	{
		if(radio.checked)
			var filter = "[contains(translate(@href, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'),'"+searchIn.value+"')]";
		else
			var filter = "[contains(translate(@title, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'),'"+searchIn.value+"')]";

		openView(filter);
	}, true);
	element.appendChild(document.createTextNode(' (View Results) '));
	map.parentNode.insertBefore(element, map);

	element = document.createElement( 'a' );
	element.addEventListener("click", function(){openView('[contains("'+GM_listValues().join()+'",@title)]')}, true);
	element.appendChild(document.createTextNode(' (View Notes) '));
	map.parentNode.insertBefore(element, map);

	var links = document.evaluate("./tbody/tr/td/a", map, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	for (var i = 0; i < links.snapshotLength; i++)
	{
		var element = links.snapshotItem(i);
		element.addEventListener("click", openPlace, false);
	}

	if (MARK_NOTES)
	{
		var links = document.evaluate('./tbody/tr/td/a[contains("'+GM_listValues().join()+'",@title)]', map, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
		for (var i = 0; i < links.snapshotLength; i++)
		{
			var element = links.snapshotItem(i);
			element.innerHTML = '&#9650;';
		}
	}
}

var element = document.createElement( 'a' );
element.addEventListener("click", openMap, true);
element.appendChild(document.createTextNode('Open Map'));

var textNode = document.createTextNode(' | ');

var insert = document.evaluate("//a[contains(@href,'http://merch.improbableisland.com')]", document, null, XPathResult.ANY_TYPE, null).iterateNext();
insert.parentNode.insertBefore(textNode, insert.nextSibling);
insert.parentNode.insertBefore(element, textNode.nextSibling);

function openPlace(event)
{
	var mark = event.target.href.indexOf("'",38);
	var row = event.target.href.slice(38,mark);
	var html = event.target.href.slice(mark+3,event.target.href.length-3);
	var info = document.getElementById("maprow_"+row);
	info.innerHTML = unescape(html);

	info.appendChild(document.createElement('br'));
	info.appendChild(document.createElement('br'));

	var element = document.createElement('strong');
	element.appendChild(document.createTextNode('Notes'));
	info.appendChild(element);

	info.appendChild(document.createElement('br'));

	var noteVal = GM_getValue(event.target.title);
	var notes = document.createTextNode(noteVal ? noteVal : '');
	info.appendChild(notes);

	info.appendChild(document.createElement('br'));
	info.appendChild(document.createElement('br'));

	element = document.createElement( 'a' );
	element.addEventListener("click", function()
	{
		var noteVal = event.target.title;
		notes.textContent = editNotes(noteVal);
		if (noteVal)
			event.target.innerHTML = '&#9650;';
	}, false);
	element.appendChild(document.createTextNode('(Edit Notes)'));
	info.appendChild(element);

	var element = document.createElement('a');
	element.appendChild(document.createTextNode(' (Close)'));
	element.addEventListener("click", function(){contentEval('$("#maprow_'+row+'").slideUp();');}, false);
	info.appendChild(element);

	contentEval('$("#maprow_'+row+'").slideDown();');

	event.preventDefault();
}

function editNotes(cell)
{
	var noteVal = GM_getValue(cell);
	var notes = prompt('', noteVal ? noteVal : '');
	if (notes == '')
	{
		GM_deleteValue(cell);
	} else if (notes != null)
	{
		GM_setValue(cell,notes);
	}

	return notes;
}

function filterMap(event)
{
	var searchString = event.target.value.toLowerCase();

	var clear = document.evaluate("./tbody/tr/td/a", map, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);	
	for (var i = 0; i < clear.snapshotLength; i++)
	{
		var element = clear.snapshotItem(i);
		element.style.color = 'black';
		element.parentNode.style.backgroundColor = null;
	}

	if (searchString == '') return;

	if(radio.checked)
		var found = document.evaluate("./tbody/tr/td/a[contains(translate(@href, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'),'"+searchString+"')]", map, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	else
		var found = document.evaluate("./tbody/tr/td/a[contains(translate(@title, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'),'"+searchString+"')]", map, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	
	for (var i = 0; i < found.snapshotLength; i++)
	{
		var element = found.snapshotItem(i);
		element.style.color = 'white';
		element.parentNode.style.backgroundColor = 'black';
	}

	count.innerHTML = ' Count: '+found.snapshotLength;
}

function openView(filter)
{
	//Top popup element
	div = document.createElement('div');
	div.style.position = 'absolute';
	div.style.zIndex = '110';
	div.style.top = '0';
	div.style.left = '0';
	div.className = 'sitecenter-lighter';

	//Dragable bar for moving map
	bar = document.createElement('div');
	bar.style.width = '100%';
	bar.style.height = '20px';
	bar.addEventListener("mousedown", startMove, true);
	bar.addEventListener("mouseup", endMove, true);
	div.appendChild(bar);

	element = document.createElement('a');
	element.appendChild(document.createTextNode('x'));
	element.style.margin = '2px 5px';
	element.style.cssFloat = 'right';
	element.addEventListener("click", function(e){document.body.removeChild(e.target.parentNode.parentNode);}, false);
	bar.appendChild(element);

	var text = document.createElement('textarea');
	text.style.width = '600px';
	text.style.height = '800px';
	div.appendChild(text);

	var links = document.evaluate("./tbody/tr/td/a"+filter, map, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);	
	for (var i = 0; i < links.snapshotLength; i++)
	{
		var element = links.snapshotItem(i);
		var html = element.href.slice(element.href.indexOf("'",38)+3,element.href.length-3);
		var name = unescape(strip(html.slice(0,html.indexOf('</i></strong>'))));
		var desc = unescape(strip(html.slice(html.indexOf('</i></strong>'))));

		text.value += 'Name: '+name+'\nLocation: '+element.parentNode.title+'\nDescription: '+desc+'\n';
		var noteVal = GM_getValue(element.title);
		if (noteVal)
			text.value += 'Notes: '+noteVal+'\n\n';
		else
			text.value += '\n';
	}

	document.body.insertBefore(div,document.body.firstChild);
}

function openMap()
{
	//Top popup element
	div = document.createElement('div');
	div.style.position = 'absolute';
	div.style.zIndex = '100';
	div.style.top = '0';
	div.style.left = '0';
	div.className = 'sitecenter-lighter';
	div.style.MozTransform = 'scale('+SCALE+')';
	div.innerHTML = GM_getValue('map');
	map = div.firstChild;

	//Dragable bar for moving map
	bar = document.createElement('div');
	bar.style.width = '100%';
	bar.style.height = '20px';
	bar.addEventListener("mousedown", startMove, true);
	bar.addEventListener("mouseup", endMove, true);
	div.insertBefore(bar, div.firstChild);

	document.body.insertBefore(div,document.body.firstChild);

	var searchIn = document.createElement( 'input' );
	if (FILTER)
		searchIn.addEventListener("keyup", filterMap, false);
	else
		searchIn.addEventListener("change", filterMap, false);
	searchIn.setAttribute('placeholder', 'Filter');
	searchIn.style.margin = '0 5px';
	bar.appendChild(searchIn);

	radio = document.createElement('input');
	radio.type = 'checkbox';
	bar.appendChild(radio);
	bar.appendChild(document.createTextNode(' Search descriptions '));

	count = document.createElement('span');
	bar.appendChild(count);

	var element = document.createElement( 'a' );
	element.addEventListener("click", function(){openView('')}, true);
	element.appendChild(document.createTextNode(' (View All) '));
	bar.appendChild(element);

	element = document.createElement( 'a' );
	element.addEventListener("click", function()
	{
		if(radio.checked)
			var filter = "[contains(translate(@href, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'),'"+searchIn.value+"')]";
		else
			var filter = "[contains(translate(@title, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'),'"+searchIn.value+"')]";

		openView(filter);
	}, true);
	element.appendChild(document.createTextNode(' (View Results) '));
	bar.appendChild(element);

	element = document.createElement( 'a' );
	element.addEventListener("click", function(){openView('[contains("'+GM_listValues().join()+'",@title)]')}, true);
	element.appendChild(document.createTextNode(' (View Notes) '));
	bar.appendChild(element);

	element = document.createElement('a');
	element.appendChild(document.createTextNode('x'));
	element.style.margin = '2px 5px';
	element.style.cssFloat = 'right';
	element.addEventListener("click", function(e){document.body.removeChild(e.target.parentNode.parentNode);}, false);
	bar.appendChild(element);

	var links = document.evaluate("./table/tbody/tr/td/a", div, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	for (var i = 0; i < links.snapshotLength; i++)
	{
		var element = links.snapshotItem(i);
		element.addEventListener("click", openPlace, false);
	}
	if (MARK_NOTES)
	{
		GM_log("./tbody/tr/td/a[contains('"+GM_listValues().join()+"',@title)]");
		var links = document.evaluate('./tbody/tr/td/a[contains("'+GM_listValues().join()+'",@title)]', map, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
		for (var i = 0; i < links.snapshotLength; i++)
		{
			var element = links.snapshotItem(i);
			element.innerHTML = '&#9650;';
		}

	}

}

function startMove(event)
{
	x = event.clientX-parseInt(div.style.left);
	y = event.clientY-parseInt(div.style.top);
	document.body.addEventListener("mousemove", move, true);
	document.body.addEventListener("mouseup", endMove, true);
}

function endMove()
{
	document.body.removeEventListener("mousemove", move, true);
	document.body.removeEventListener("mouseup", endMove, true);
}

function move(event)
{
	div.style.top = event.clientY-y;
	div.style.left = event.clientX-x;
}

function contentEval(source) {
  // Check for function input.
  if ('function' == typeof source) {
    // Execute this function with no arguments, by adding parentheses.
    // One set around the function, required for valid syntax, and a
    // second empty set calls the surrounded function.
    source = '(' + source + ')();'
  }

  // Create a script node holding this  source code.
  var script = document.createElement('script');
  script.setAttribute("type", "application/javascript");
  script.textContent = source;

  // Insert the script node into the page, so it will run, and immediately
  // remove it to clean up.
  document.body.appendChild(script);
  document.body.removeChild(script);
}

function strip(html)
{
	var tmp = document.createElement("DIV");
	tmp.innerHTML = html;
	return tmp.textContent;
}
