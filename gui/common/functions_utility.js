/**
 * Used for acoustic GUI notifications.
 * Define the soundfile paths and specific time thresholds (avoid spam).
 * And store the timestamp of last interaction for each notification.
 */
var g_SoundNotifications = {
	"nick": { "soundfile": "audio/interface/ui/chat_alert.ogg", "threshold": 3000 },
	"gamesetup.join": { "soundfile": "audio/interface/ui/gamesetup_join.ogg", "threshold": 0 }
};

/**
 * These events are fired when the user has closed the options page.
 * The handlers are provided a Set storing which config values have changed.
 * TODO: This should become a GUI event sent by the engine.
 */
var g_ConfigChangeHandlers = new Set();

function registerConfigChangeHandler(handler)
{
	g_ConfigChangeHandlers.add(handler);
}

/**
 * @param changes - a Set of config names
 */
function fireConfigChangeHandlers(changes)
{
	for (let handler of g_ConfigChangeHandlers)
		handler(changes);
}

/**
 * Returns translated history and gameplay data of all civs, optionally including a mock gaia civ.
 */
function loadCivData(selectableOnly, gaia)
{
	let civData = loadCivFiles(selectableOnly);

	translateObjectKeys(civData, ["Name", "Description", "History", "Special"]);

	if (gaia)
		civData.gaia = { "Code": "gaia", "Name": translate("Gaia") };

	return deepfreeze(civData);
}

// A sorting function for arrays of objects with 'name' properties, ignoring case
function sortNameIgnoreCase(x, y)
{
	let lowerX = x.name.toLowerCase();
	let lowerY = y.name.toLowerCase();

	if (lowerX < lowerY)
		return -1;
	if (lowerX > lowerY)
		return 1;
	return 0;
}

/**
 * Escape tag start and escape characters, so users cannot use special formatting.
 */
function escapeText(text)
{
	return text.replace(/\\/g, "\\\\").replace(/\[/g, "\\[");
}

function unescapeText(text)
{
	return text.replace(/\\\\/g, "\\").replace(/\\\[/g, "\[");
}

/**
 * Prepends a backslash to all quotation marks.
 */
function escapeQuotation(text)
{
	return text.replace(/"/g, "\\\"");
}

/**
 * Merge players by team to remove duplicate Team entries, thus reducing the packet size of the lobby report.
 */
function playerDataToStringifiedTeamList(playerData)
{
	let teamList = {};

	for (let pData of playerData)
	{
		let team = pData.Team === undefined ? -1 : pData.Team;
		if (!teamList[team])
			teamList[team] = [];
		teamList[team].push(pData);
		delete teamList[team].Team;
	}

	return escapeText(JSON.stringify(teamList));
}

function stringifiedTeamListToPlayerData(stringifiedTeamList)
{
	let teamList = {};
	try
	{
		teamList = JSON.parse(unescapeText(stringifiedTeamList));
	}
	catch (e)
	{
		// Ignore invalid input from remote users
		return [];
	}

	let playerData = [];

	for (let team in teamList)
		for (let pData of teamList[team])
		{
			pData.Team = team;
			playerData.push(pData);
		}

	return playerData;
}

function removeDupes(array)
{
	// loop backwards to make splice operations cheaper
	let i = array.length;
	while (i--)
		if (array.indexOf(array[i]) != i)
			array.splice(i, 1);
}

function singleplayerName()
{
	return Engine.ConfigDB_GetValue("user", "playername.singleplayer") || Engine.GetSystemUsername();
}

function multiplayerName()
{
	return Engine.ConfigDB_GetValue("user", "playername.multiplayer") || Engine.GetSystemUsername();
}

function tryAutoComplete(text, autoCompleteList)
{
	if (!text.length)
		return text;

	var wordSplit = text.split(/\s/g);
	if (!wordSplit.length)
		return text;

	var lastWord = wordSplit.pop();
	if (!lastWord.length)
		return text;

	for (var word of autoCompleteList)
	{
		if (word.toLowerCase().indexOf(lastWord.toLowerCase()) != 0)
			continue;

		text = wordSplit.join(" ");
		if (text.length > 0)
			text += " ";

		text += word;
		break;
	}
	return text;
}

function autoCompleteText(guiObject, words)
{
	let text = guiObject.caption;
	if (!text.length)
		return;

	let bufferPosition = guiObject.buffer_position;
	let textTillBufferPosition = text.substring(0, bufferPosition);
	let newText = tryAutoComplete(textTillBufferPosition, words);

	guiObject.caption = newText + text.substring(bufferPosition);
	guiObject.buffer_position = bufferPosition + (newText.length - textTillBufferPosition.length);
}

/**
 * Manage acoustic GUI notifications.
 *
 * @param {string} type - Notification type.
 */
function soundNotification(type)
{
	if (Engine.ConfigDB_GetValue("user", "sound.notify." + type) != "true")
		return;

	let notificationType = g_SoundNotifications[type];
	let timeNow = Date.now();

	if (!notificationType.lastInteractionTime || timeNow > notificationType.lastInteractionTime + notificationType.threshold){
		print(notificationType.soundfile.toString());
		Engine.PlayUISound(notificationType.soundfile, false);
	}


	notificationType.lastInteractionTime = timeNow;
}

/**
 * Horizontally spaces objects within a parent
 *
 * @param margin The gap, in px, between the objects
 */
function horizontallySpaceObjects(parentName, margin = 0)
{
	let objects = Engine.GetGUIObjectByName(parentName).children;
	for (let i = 0; i < objects.length; ++i)
	{
		let size = objects[i].size;
		let width = size.right - size.left;
		size.left = i * (width + margin) + margin;
		size.right = (i + 1) * (width + margin);
		objects[i].size = size;
	}
}

/**
 * Change the width of a GUIObject to make the caption fits nicely.
 * @param {Object} object - The GUIObject to consider.
 * @param {Object} align - Directions to change the side either "left" or "right" for horizontal and "top" or "bottom" for vertical.
 * @param {Object} margin - Margins to be added to the width and height (can be negative).
 */
function resizeGUIObjectToCaption(object, align, margin = {})
{
	const objectSize = object.size;
	const textSize = Engine.GetTextSize(object.font, object.caption);
	if (align.horizontal)
	{
		const width = textSize.width + 2 * object.buffer_zone + (margin.horizontal || 0);
		switch (align.horizontal)
		{
		case "right":
			objectSize.right = object.size.left + width;
			break;
		case "left":
			objectSize.left = object.size.right - width;
			break;
		case "center":
			const oldWidth = object.size.right - object.size.left;
			const widthDiff = width - oldWidth;
			objectSize.right = object.size.right + (widthDiff / 2);
			objectSize.left = object.size.left - (widthDiff / 2);
			break;
		default:
		}
	}

	if (align.vertical)
	{
		const height = textSize.height + (margin.vertical || 0);
		switch (align.vertical)
		{
		case "bottom":
			objectSize.bottom = object.size.top + height;
			break;
		case "top":
			objectSize.top = object.size.bottom - height;
			break;
		default:
		}
	}

	object.size = objectSize;
	return objectSize;
}

/**
 * Hide all children after a certain index
 */
function hideRemaining(parentName, start = 0)
{
	let objects = Engine.GetGUIObjectByName(parentName).children;

	for (let i = start; i < objects.length; ++i)
		objects[i].hidden = true;
}

function getBuildString()
{
	return sprintf(translate("Build: %(buildDate)s (%(version)s)"), {
		"buildDate": Engine.GetBuildDate(),
		"version": Engine.GetBuildVersion()
	});
}

/**
 * Opens a page. If that page completes with an object with a @a nextPage
 *	property that page is opened with the @a args property of that object.
 *	That continues untill there is no @a nextPage property in the completion
 *	value. If there is no @a nextPage in the completion value the
 *	@a completionValue is returned.
 * @param {String} page - The page first opened.
 * @param args - passed to the first page opened.
 */
async function pageLoop(page, args)
{
	let completionValue = { "nextPage": page, "args": args };
	while (completionValue?.nextPage != null)
		completionValue = await Engine.PushGuiPage(completionValue.nextPage, completionValue.args);

	return completionValue;
}

function formatXmppAnnouncement(subject, text)
{
	var message = "";
	const subjectTrimmed = subject.trim();
	const textTrimmed = text.trim();
	if (subjectTrimmed.length > 0)
		message += subjectTrimmed;
	if (subjectTrimmed.length > 0 && textTrimmed.length > 0)
		message += "\n\n";
	if (textTrimmed.length > 0)
		message += textTrimmed;

	return message;
}
