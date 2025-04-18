/**
 * This class deals with the button that opens the leaderboard page.
 */
class LeaderboardButton
{
	constructor(xmppMessages, leaderboardPage)
	{
		this.leaderboardButton = Engine.GetGUIObjectByName("leaderboardButton");
		this.leaderboardButton.caption = translate("Options");
		this.leaderboardButton.onPress = this.onPress; //Engine.PushGuiPage("page_manual.xml");

		let onConnectionStatusChange = this.onConnectionStatusChange.bind(this);
		//xmppMessages.registerXmppMessageHandler("system", "connected", onConnectionStatusChange);
		//xmppMessages.registerXmppMessageHandler("system", "disconnected", onConnectionStatusChange);
		this.onConnectionStatusChange();
	}

	onConnectionStatusChange()
	{
		this.leaderboardButton.enabled = Engine.IsXmppClientConnected();
	}

	async onPress()
	{
		//closeOpenDialogs();
		//this.pauseControl.implicitPause();
		await Engine.PushGuiPage("page_options.xml");
		//resumeGame();
	}


}
