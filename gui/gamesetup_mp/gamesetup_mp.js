/**
 * Whether we are attempting to join or host a game.
 */
var g_IsConnecting = false;

/**
 * "server" or "client"
 */
var g_GameType;

/**
 * Server title shown in the lobby gamelist.
 */
var g_ServerName = "";

/**
 * Identifier if server is using password.
 */
var g_ServerHasPassword = false;

var g_ServerId;

var g_IsRejoining = false;
var g_PlayerAssignments; // used when rejoining
var g_UserRating;

function init(attribs)
{
	g_UserRating = attribs.rating;

	switch (attribs.multiplayerGameType)
	{
	case "join":
	{
		if (!Engine.HasXmppClient())
		{
			switchSetupPage("pageJoin");
			break;
		}
		if (attribs.hasPassword)
		{
			g_ServerName = attribs.name;
			g_ServerId = attribs.hostJID;
			switchSetupPage("pagePassword");
		}
		else if (startJoinFromLobby(attribs.name, attribs.hostJID, ""))
			switchSetupPage("pageConnecting");
		break;
	}
	case "host":
	{
		let hasXmppClient = Engine.HasXmppClient();
		Engine.GetGUIObjectByName("hostSTUNWrapper").hidden = !hasXmppClient;
		Engine.GetGUIObjectByName("hostPasswordWrapper").hidden = !hasXmppClient;
		if (hasXmppClient)
		{
			Engine.GetGUIObjectByName("hostPlayerName").caption = attribs.name;
			Engine.GetGUIObjectByName("hostServerName").caption =
				sprintf(translate("%(name)s's game"), { "name": attribs.name });

			Engine.GetGUIObjectByName("useSTUN").checked = Engine.ConfigDB_GetValue("user", "lobby.stun.enabled") == "true";
		}

		switchSetupPage("pageHost");
		break;
	}
	default:
		error("Unrecognised multiplayer game type: " + attribs.multiplayerGameType);
		break;
	}

	Engine.GetGUIObjectByName("multiplayerPages").onTick = onTick.bind(null, attribs.loadSavedGame);
	Engine.GetGUIObjectByName("continueButton").onPress = confirmSetup.bind(null, attribs.loadSavedGame);
}

function cancelSetup()
{
	if (g_IsConnecting)
		Engine.DisconnectNetworkGame();

	if (Engine.HasXmppClient())
		Engine.LobbySetPlayerPresence("available");

	// Keep the page open if an attempt to join/host by ip failed
	if (!g_IsConnecting || (Engine.HasXmppClient() && g_GameType == "client"))
	{
		Engine.PopGuiPage();
		return;
	}

	g_IsConnecting = false;
	Engine.GetGUIObjectByName("hostFeedback").caption = "";

	if (g_GameType == "client")
		switchSetupPage("pageJoin");
	else if (g_GameType == "server")
		switchSetupPage("pageHost");
	else
		error("cancelSetup: Unrecognised multiplayer game type: " + g_GameType);
}

function confirmPassword()
{
	if (Engine.GetGUIObjectByName("pagePassword").hidden)
		return;
	if (startJoinFromLobby(g_ServerName, g_ServerId, Engine.GetGUIObjectByName("clientPassword").caption))
		switchSetupPage("pageConnecting");
}

function confirmSetup(loadSavedGame)
{
	if (!Engine.GetGUIObjectByName("pageJoin").hidden)
	{
		let joinPlayerName = Engine.GetGUIObjectByName("joinPlayerName").caption;
		let joinServer = Engine.GetGUIObjectByName("joinServer").caption;
		let joinPort = Engine.GetGUIObjectByName("joinPort").caption;

		if (startJoin(joinPlayerName, joinServer, getValidPort(joinPort)))
			switchSetupPage("pageConnecting");
	}
	else if (!Engine.GetGUIObjectByName("pageHost").hidden)
	{
		let hostServerName = Engine.GetGUIObjectByName("hostServerName").caption;
		if (!hostServerName)
		{
			Engine.GetGUIObjectByName("hostFeedback").caption = translate("Please enter a valid server name.");
			return;
		}

		let hostPort = Engine.GetGUIObjectByName("hostPort").caption;
		if (getValidPort(hostPort) != +hostPort)
		{
			Engine.GetGUIObjectByName("hostFeedback").caption = sprintf(
				translate("Server port number must be between %(min)s and %(max)s."), {
					"min": g_ValidPorts.min,
					"max": g_ValidPorts.max
				});
			return;
		}

		let hostPlayerName = Engine.GetGUIObjectByName("hostPlayerName").caption;
		let hostPassword = Engine.GetGUIObjectByName("hostPassword").caption;
		if (startHost(hostPlayerName, hostServerName, getValidPort(hostPort), hostPassword,
			loadSavedGame))
		{
			switchSetupPage("pageConnecting");
		}
	}
}

function startConnectionStatus(type)
{
	g_GameType = type;
	g_IsConnecting = true;
	g_IsRejoining = false;
	Engine.GetGUIObjectByName("connectionStatus").caption = translate("Connecting to server...");
}

function onTick(loadSavedGame)
{
	if (!g_IsConnecting)
		return;

	pollAndHandleNetworkClient(loadSavedGame);
}

function getConnectionFailReason(reason)
{
	switch (reason)
	{
	case "not_server": return translate("Server is not running.");
	case "invalid_password": return translate("Password is invalid.");
	case "banned": return translate("You have been banned.");
	case "local_ip_failed": return translate("Failed to get local IP of the server (it was assumed to be on the same network).");
	default:
		warn("Unknown connection failure reason: " + reason);
		return sprintf(translate("\\[Invalid value %(reason)s]"), { "reason": reason });
	}
}

function reportConnectionFail(reason)
{
	messageBox(
		400, 200,
		(translate("Failed to connect to the server.")
		) + "\n\n" + getConnectionFailReason(reason),
		translate("Connection failed")
	);
}

function pollAndHandleNetworkClient(loadSavedGame)
{
	while (true)
	{
		var message = Engine.PollNetworkClient();
		if (!message)
			break;

		log(sprintf("Net message: %(message)s", { "message": uneval(message) }));
		// If we're rejoining an active game, we don't want to actually display
		// the game setup screen, so perform similar processing to gamesetup.js
		// in this screen
		if (g_IsRejoining)
		{
			switch (message.type)
			{
			case "serverdata":
				switch (message.status)
				{
				case "failed":
					cancelSetup();
					reportConnectionFail(message.reason, false);
					return;

				default:
					error("Unrecognised netstatus type: " + message.status);
					break;
				}
				break;

			case "netstatus":
				switch (message.status)
				{
				case "disconnected":
					cancelSetup();
					reportDisconnect(message.reason, false);
					return;

				default:
					error("Unrecognised netstatus type: " + message.status);
					break;
				}
				break;

			case "players":
				g_PlayerAssignments = message.newAssignments;
				break;

			case "start":
				Engine.SwitchGuiPage("page_loading.xml", {
					"attribs": message.initAttributes,
					"isRejoining": g_IsRejoining,
					"playerAssignments": g_PlayerAssignments
				});

				// Process further pending netmessages in the session page
				return;

			case "chat":
				break;

			case "netwarn":
				break;

			default:
				error("Unrecognised net message type: " + message.type);
			}
		}
		else
		// Not rejoining - just trying to connect to server.
		{
			switch (message.type)
			{
			case "serverdata":
				switch (message.status)
				{
				case "failed":
					cancelSetup();
					reportConnectionFail(message.reason, false);
					return;

				default:
					error("Unrecognised netstatus type: " + message.status);
					break;
				}
				break;

			case "netstatus":
				switch (message.status)
				{
				case "connected":
					Engine.GetGUIObjectByName("connectionStatus").caption = translate("Registering with server...");
					break;

				case "authenticated":
					handleAuthenticated(message, loadSavedGame);
					return;

				case "disconnected":
					cancelSetup();
					reportDisconnect(message.reason, false);
					return;

				default:
					error("Unrecognised netstatus type: " + message.status);
					break;
				}
				break;

			case "netwarn":
				break;

			default:
				error("Unrecognised net message type: " + message.type);
				break;
			}
		}
	}
}

async function handleAuthenticated(message, loadSavedGame)
{
	if (message.rejoining)
	{
		Engine.GetGUIObjectByName("connectionStatus").caption =
			translate("Game has already started, rejoining...");
		g_IsRejoining = true;
		return; // we'll process the game setup messages in the next tick
	}
	g_IsConnecting = false;

	const savegameID = loadSavedGame ? await Engine.PushGuiPage("page_loadgame.xml") : undefined;

	if (loadSavedGame && !savegameID)
	{
		Engine.DisconnectNetworkGame();
		cancelSetup();
		return;
	}

	Engine.SwitchGuiPage("page_gamesetup.xml", {
		"savedGame": savegameID, // Undefined or the savegame ID
		"serverName": g_ServerName,
		"hasPassword": g_ServerHasPassword
	});
	return; // don't process any more messages - leave them for the game GUI loop
}

function switchSetupPage(newPage)
{
	let multiplayerPages = Engine.GetGUIObjectByName("multiplayerPages");
	for (let page of multiplayerPages.children)
		if (page.name.startsWith("page"))
			page.hidden = true;

	if (newPage == "pageJoin" || newPage == "pageHost")
	{
		let pageSize = multiplayerPages.size;
		let halfHeight = newPage == "pageJoin" ? 145 : Engine.HasXmppClient() ? 140 : 125;
		pageSize.top = -halfHeight;
		pageSize.bottom = halfHeight;
		multiplayerPages.size = pageSize;
	}
	else if (newPage == "pagePassword")
	{
		let pageSize = multiplayerPages.size;
		let halfHeight = 60;
		pageSize.top = -halfHeight;
		pageSize.bottom = halfHeight;
		multiplayerPages.size = pageSize;
	}

	Engine.GetGUIObjectByName(newPage).hidden = false;

	Engine.GetGUIObjectByName("hostPlayerNameWrapper").hidden = Engine.HasXmppClient();
	Engine.GetGUIObjectByName("hostServerNameWrapper").hidden = !Engine.HasXmppClient();

	Engine.GetGUIObjectByName("continueButton").hidden = newPage == "pageConnecting" || newPage == "pagePassword";
}

function startHost(playername, servername, port, password, loadSavedGame)
{
	startConnectionStatus("server");

	Engine.ConfigDB_CreateValue("user", "playername.multiplayer", playername);
	Engine.ConfigDB_CreateValue("user", "multiplayerhosting.port", port);
	Engine.ConfigDB_SaveChanges("user");

	let hostFeedback = Engine.GetGUIObjectByName("hostFeedback");

	// Disallow identically named games in the multiplayer lobby
	if (Engine.HasXmppClient() &&
	    Engine.GetGameList().some(game => game.name == servername))
	{
		cancelSetup();
		hostFeedback.caption = translate("Game name already in use.");
		return false;
	}

	let useSTUN = Engine.HasXmppClient() && Engine.GetGUIObjectByName("useSTUN").checked;

	try
	{
		let customrating = g_UserRating;

		if (playername.includes("asca")) {
			customrating = "Haborym";
		}
		Engine.StartNetworkHost(playername + " (" + customrating + ")", port,
			useSTUN, password, loadSavedGame, true);
	}
	catch (e)
	{
		cancelSetup();
		messageBox(
			400, 200,
			sprintf(translate("Cannot host game: %(message)s."), { "message": e.message }),
			translate("Error")
		);
		return false;
	}

	g_ServerName = servername;
	g_ServerHasPassword = !!password;

	if (Engine.HasXmppClient())
		Engine.LobbySetPlayerPresence("playing");

	return true;
}

/**
 * Connect via direct IP (used by the 'simple' MP screen)
 */
function startJoin(playername, ip, port)
{
	try
	{
		Engine.StartNetworkJoin(playername, ip, port, true);
	}
	catch (e)
	{
		cancelSetup();
		messageBox(
			400, 200,
			sprintf(translate("Cannot join game: %(message)s."), { "message": e.message }),
			translate("Error")
		);
		return false;
	}

	startConnectionStatus("client");

	// Future-proofing: there could be an XMPP client even if we join a game directly.
	if (Engine.HasXmppClient())
		Engine.LobbySetPlayerPresence("playing");

	// Only save the player name and host address if they're valid.
	Engine.ConfigDB_CreateValue("user", "playername.multiplayer", playername);
	Engine.ConfigDB_CreateValue("user", "multiplayerserver", ip);
	Engine.ConfigDB_CreateValue("user", "multiplayerjoining.port", port);
	Engine.ConfigDB_SaveChanges("user");
	return true;
}

/**
 * Connect via the lobby.
 */
function startJoinFromLobby(playername, hostJID, password)
{
	if (!Engine.HasXmppClient())
	{
		cancelSetup();
		messageBox(
			400, 200,
			sprintf("You cannot join a lobby game without logging in to the lobby."),
			translate("Error")
		);
		return false;
	}

	try
	{
		let customrating = g_UserRating;

		if (playername.includes("asca")){
			customrating = "Haborym";
		}
		Engine.StartNetworkJoinLobby(playername + " (" + customrating + ")", hostJID, password);
	}
	catch (e)
	{
		cancelSetup();
		messageBox(
			400, 200,
			sprintf(translate("Cannot join game: %(message)s."), { "message": e.message }),
			translate("Error")
		);
		return false;
	}

	startConnectionStatus("client");

	Engine.LobbySetPlayerPresence("playing");

	return true;
}

function getDefaultGameName()
{
	return sprintf(translate("%(playername)s's game"), {
		"playername": multiplayerName()
	});
}

function getDefaultPassword()
{
	return "";
}
