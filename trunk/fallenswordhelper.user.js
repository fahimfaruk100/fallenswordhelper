// ==UserScript==
// @name           FallenSwordHelper
// @namespace      terrasoft.gr
// @description    Fallen Sword Helper
// @include        http://www.fallensword.com/*
// @include        http://fallensword.com/*
// @include        http://*.fallensword.com/*
// @exclude        http://forum.fallensword.com/*
// @exclude        http://wiki.fallensword.com/*
// @require        json2.js
// @require        calfSystem.js
// @require        fsLayout.js
// @require        fsData.js
// ==/UserScript==

// No warranty expressed or implied. Use at your own risk.

var Helper = {
	// System functions
	init: function(e) {
		Helper.initSettings();
		Helper.beginAutoUpdate();
		Helper.readInfo();
		this.initialized = true;
	},

	initSettings: function() {
		System.setDefault("enableLogColoring", true);
		System.setDefault("enableCreatureColoring", true);
		System.setDefault("showCombatLog", true);
		System.setDefault("showCreatureInfo", true);
		System.setDefault("keepLogs", false);

		System.setDefault("showCompletedQuests", true);
		System.setDefault("showExtraLinks", true);
		System.setDefault("huntingBuffs", "Doubler,Librarian,Adept Learner,Merchant,Treasure Hunter,Animal Magnetism,Conserve");
		System.setDefault("showHuntingBuffs", true);
		System.setDefault("moveFSBox", false);
		System.setDefault("hideNewBox", false);

		System.setDefault("guildSelf", "");
		System.setDefault("guildFrnd", "");
		System.setDefault("guildPast", "");
		System.setDefault("guildEnmy", "");
		System.setDefault("goldRecipient", "");
		System.setDefault("goldAmount", "");
		System.setDefault("sendGoldonWorld", false);
		System.setDefault("goldConfirm", "");
		System.setDefault("guildSelfMessage", "green|Member of your own guild");
		System.setDefault("guildFrndMessage", "yellow|Do not attack - Guild is friendly!");
		System.setDefault("guildPastMessage", "gray|Do not attack - You've been in that guild once!");
		System.setDefault("guildEnmyMessage", "red|Enemy guild. Attack at will!");

		System.setDefault("hideKrulPortal", false);
		System.setDefault("hideQuests", false);
		System.setDefault("hideQuestNames", "");
		System.setDefault("hideRecipes", false);
		System.setDefault("hideRecipeNames", "");
		System.setDefault("footprintsColor", "silver");
		System.setDefault("chatTopToBottom", true);
		System.setDefault("enableGuildOnlineList", true);
		System.setDefault("guildOnlineRefreshTime", 15);
		System.setDefault("hideMatchesForCompletedMoves", false);
		System.setDefault("quickKill", true);
		System.setDefault("doNotKillList", "");
		System.setDefault("enableBioCompressor", false);
		System.setDefault("maxCompressedCharacters", 1500);
		System.setDefault("maxCompressedLines", 25);
		System.setDefault("hideArenaPrizes", "");
		System.setDefault("autoSortArenaList", false);

		Helper.itemFilters = [
		{"id":"showGloveTypeItems", "type":"glove"},
		{"id":"showHelmetTypeItems", "type":"helm"},
		{"id":"showAmuletTypeItems", "type":"amulet"},
		{"id":"showWeaponTypeItems", "type":"weapon"},
		{"id":"showAmorTypeItems", "type":"armor"},
		{"id":"showShieldTypeItems", "type":"shield"},
		{"id":"showRingTypeItems", "type":"ring"},
		{"id":"showBootTypeItems", "type":"boot"},
		{"id":"showRuneTypeItems", "type":"rune"},
		];

		for (var i=0; i<Helper.itemFilters.length; i++) {
			System.setDefault(Helper.itemFilters[i].id, true);
		}
		
		System.setDefault("showQuickDropLinks", false);

		try {
			var quickSearchList = System.getValueJSON("quickSearchList");
		}
		catch (err) {
			GM_log(err);
			quickSearchList = null;
		}

		if (!quickSearchList) {
			quickSearchList = Data.quickSearchList()
			Helper.sortAsc = true;
			Helper.sortBy = "category";
			quickSearchList.sort(Helper.stringSort);
			System.setValueJSON("quickSearchList", quickSearchList);
		}

		var memberList = System.getValueJSON("memberlist");
		if (!memberList || !memberList.lastUpdate) GM_setValue("memberlist", "");
	},

	readInfo: function() {
		var charInfo = System.findNode("//img[contains(@src,'skin/icon_player.gif')]");
		if (!charInfo) { return; }
		var charInfoText = charInfo.getAttribute("onmouseover");
		Helper.characterName = charInfoText.match(/Name:\s*<\/td><td width=\\\'90%\\\'>([0-9a-z]+)/i)[1];
		Helper.characterLevel = System.getIntFromRegExp(charInfoText, /Level:\s*<\/td><td width=\\\'90%\\\'>(\d+)/i);
		Helper.characterAttack = System.getIntFromRegExp(charInfoText, /Attack:\s*<\/td><td width=\\\'90%\\\'>(\d+)/i);
		Helper.characterDefense = System.getIntFromRegExp(charInfoText, /Defense:\s*<\/td><td width=\\\'90%\\\'>(\d+)/i);
		Helper.characterHP = charInfoText.match(/HP:\s*<\/td><td width=\\\'90%\\\'>(\d+)/i)[1];
		Helper.characterArmor = charInfoText.match(/Armor:\s*<\/td><td width=\\\'90%\\\'>(\d+)/i)[1];
		Helper.characterDamage = charInfoText.match(/Damage:\s*<\/td><td width=\\\'90%\\\'>(\d+)/i)[1];
		GM_setValue("CharacterName", Helper.characterName);
	},

	// Autoupdate
	beginAutoUpdate: function() {
		var lastCheck = GM_getValue("lastVersionCheck");
		var now = (new Date()).getTime();
		if (!lastCheck) lastCheck = 0;
		var haveToCheck = ((now - lastCheck) > 6 * 60 * 60 * 1000)
		if (haveToCheck) {
			Helper.checkForUpdate();
		}
	},

	checkForUpdate: function() {
		GM_log("Checking for new version...")
		var now = (new Date()).getTime();
		GM_setValue("lastVersionCheck", now.toString());
		GM_xmlhttpRequest({
			method: 'GET',
			url: "http://fallenswordhelper.googlecode.com/svn/trunk/?nonce=" + now,
			headers: {
				"User-Agent": navigator.userAgent,
				"Referer": document.location
			},
			onload: function(responseDetails) {
				Helper.autoUpdate(responseDetails);
			}
		})
	},

	autoUpdate: function(responseDetails) {
		if (responseDetails.status != 200) return;
		var now = (new Date()).getTime()
		GM_setValue("lastVersionCheck", now.toString());
		var currentVersion = GM_getValue("currentVersion");
		if (!currentVersion) currentVersion = 0;
		var versionRE = /Revision\s*([0-9]+):/;
		var latestVersion = responseDetails.responseText.match(versionRE)[1];
		GM_log("Current version: " + currentVersion);
		GM_log("Found version: " + latestVersion);

		if (currentVersion != latestVersion) {
			GM_xmlhttpRequest({
				method: 'GET',
				url: "http://fallenswordhelper.googlecode.com/svn/wiki/ChangeLog.wiki?nonce=" + now,
				headers: {
					"User-Agent": navigator.userAgent,
					"Referer": document.location
				},
				onload: function(responseDetails) {
					Helper.autoUpdateConfirm(responseDetails, currentVersion, latestVersion);
				}
			})
		}
	},

	autoUpdateConfirm: function(responseDetails, oldVersion, newVersion) {
		var theChanges = Layout.formatWiki(responseDetails.responseText, oldVersion, newVersion);
		var confirmAlert = document.createElement("DIV");
		confirmAlert.id = 'Helper:ConfirmAlert';
		var divHeight = window.innerHeight - 160;

		confirmAlert.style.position = "absolute";
		confirmAlert.style.left = (window.innerWidth - 500) / 2 + "px";
		confirmAlert.style.top = (80 + window.scrollY) + "px";
		confirmAlert.style.width = "500px";
		confirmAlert.style.height = divHeight + "px";
		confirmAlert.style.display = 'block';
		confirmAlert.style.zIndex = '90';
		confirmAlert.style.filter = 'alpha';
		confirmAlert.style.opacity = '0.9';
		confirmAlert.style.background = 'black';
		confirmAlert.style.color = 'white';
		confirmAlert.style.border = 'ridge';

		confirmAlert.innerHTML = '<div height="20" style="background-color:#4a3918;">' +
			'<div style="color:yellow;position:absolute;top:0px;left:0px">New version (' + newVersion + ') found. Update from version ' + oldVersion + '?' +
			'</div><div style="position:absolute;top:0px;right:0px">' +
			'<input type="button" id="Helper:AutoUpdateOk" value="Ok" class="custombutton">' +
			'&nbsp;<input type="button" id="Helper:AutoUpdateCancel" value="Cancel" class="custombutton"></div></div>' +
			'<div id="Helper:Output" style="margin-top:20px;height:' + (divHeight-20) + 'px;overflow:auto;">' + theChanges + '</div>';
		document.body.insertBefore(confirmAlert, document.body.firstChild);
		document.getElementById("Helper:AutoUpdateOk").addEventListener("click", Helper.autoUpdateConfirmOk, true);
		document.getElementById("Helper:AutoUpdateOk").setAttribute("newVersion", newVersion);
		document.getElementById("Helper:AutoUpdateCancel").addEventListener("click", Helper.autoUpdateConfirmCancel, true);
	},

	autoUpdateConfirmOk: function(evt) {
		var newVersion = parseInt(evt.target.getAttribute("newVersion"));
		GM_setValue("currentVersion", newVersion);
		GM_openInTab("http://fallenswordhelper.googlecode.com/svn-history/r" + newVersion + "/trunk/fallenswordhelper.user.js");
		Helper.autoUpdateConfirmCancel(evt);
	},

	autoUpdateConfirmCancel: function(evt) {
		var confirmAlert = document.getElementById("Helper:ConfirmAlert");
		confirmAlert.style.display = "none";
		confirmAlert.visibility = "hidden";
	},

	// main event dispatcher
	onPageLoad: function(anEvent) {
		Helper.init();
		Layout.hideBanner();
		Layout.moveFSBox();
		Helper.prepareGuildList();
		Helper.prepareChat();
		Helper.injectStaminaCalculator();
		Helper.injectLevelupCalculator();
		Layout.injectMenu();
		Layout.hideNewBox();
		Helper.replaceKeyHandler();

		var pageId, subPageId, subPage2Id, subsequentPageId
		if (document.location.search != "") {
			var re=/cmd=([a-z]+)/;
			var pageIdRE = re.exec(document.location.search);
			pageId="-";
			if (pageIdRE)
				pageId=pageIdRE[1];

			re=/subcmd=([a-z]+)/;
			var subPageIdRE = re.exec(document.location.search);
			subPageId="-";
			if (subPageIdRE)
				subPageId=subPageIdRE[1];

			re=/subcmd2=([a-z]+)/;
			var subPage2IdRE = re.exec(document.location.search);
			subPage2Id="-";
			if (subPage2IdRE)
				subPage2Id=subPage2IdRE[1];

			re=/page=([0-9]+)/;
			var subsequentPageIdRE = re.exec(document.location.search);
			subsequentPageId="-";
			if (subsequentPageIdRE)
				subsequentPageId=subsequentPageIdRE[1];
		} else {
			pageId=System.findNode("//input[@type='hidden' and @name='cmd']");
			pageId = pageId?pageId.getAttribute("value"):"-";

			subPageId=System.findNode("//input[@type='hidden' and @name='subcmd']")
			subPageId=subPageId?subPageId.getAttribute("value"):"-";

			subPage2Id=System.findNode("//input[@type='hidden' and @name='subcmd2']");
			subPage2Id=subPage2Id?subPage2Id.getAttribute("value"):"-";

			subsequentPageId=System.findNode("//input[@type='hidden' and @name='page']")
			subsequentPageId=subsequentPageId?subsequentPageId.getAttribute("value"):"-";
		}

		Helper.page = pageId + "/" + subPageId + "/" + subPage2Id + "(" + subsequentPageId + ")"

		switch (pageId) {
		case "settings":
			Helper.injectSettings();
			break;
		case "world":
			switch (subPageId) {
			case "viewcreature":
				Helper.injectCreature();
				break;
			case "map":
				Helper.injectWorldMap();
				break;
			default:
				Helper.injectWorld();
			}
			break;
		case "news":
			switch (subPageId) {
			case "fsbox":
				Helper.injectShoutboxWidgets('fsbox_input', 100);
				break;
			case "shoutbox":
				Helper.injectShoutboxWidgets('shoutbox_input', 150);
				break;
			}
			break;
		case "blacksmith":
			switch (subPageId) {
			case "repairall":
				Helper.injectWorld();
				break;
			}
			break;
		case "arena":
			switch (subPageId) {
			case "-":
				Helper.injectArena();
				break;
			case "completed":
				Helper.storeCompletedArenas();
				break;
			case "pickmove":
				Helper.storeArenaMoves();
				break;
			case "results":
				Helper.injectTournament();
				break;
			case "dojoin":
				Helper.injectTournament();
				break;
			}
			break;
		case "questbook":
			switch (subPageId) {
			case "-":
				Helper.injectQuestBookLite();
				break;
			case "viewquest":
				Helper.injectQuestTracker();
				break;
			}
			Helper.injectQuestBookFull();
			break;
		case "profile":
			switch (subPageId) {
			case "dropitems":
				Helper.injectDropItems();
				break;
			case "changebio":
				Helper.injectBioWidgets();
				break;
			case "-":
				Helper.injectProfile();
			}
			break;
		case "auctionhouse":
			switch (subPageId) {
			case "create":
				Helper.injectCreateAuctionTemplate();
				break;
			case "preferences":
				break;
			default:
				Helper.injectAuctionHouse();
			}
			break;
		case "guild":
			switch (subPageId) {
			case "inventory":
				switch (subPage2Id) {
					case "report":
						Helper.injectReportPaint();
						break;
					default:
						Helper.injectDropItems();
				}
				break;
			case "chat":
				Helper.addLogColoring("Chat", 0);
				break;
			case "reliclist":
				Helper.injectRelicList();
				break;
			case "log":
				Helper.addLogColoring("GuildLog", 1);
				Helper.addGuildLogWidgets();
				break;
			case "groups":
				switch (subPage2Id) {
					case "viewstats":
						Helper.injectGroupStats();
						break;
					default:
						Helper.injectGroups();
				}
				break;
			case "manage":
				Helper.injectGuild();
				break;
			case "advisor":
				Helper.injectAdvisor(subPage2Id);
				break;
			case "history":
				Helper.addHistoryWidgets();
				break;
			}
			break;
		case "bank":
			Helper.injectBank();
			break;
		case "log":
			switch (subPageId) {
			case "outbox":
				Helper.addLogColoring("OutBox", 1);
				break;
			case "-":
				Helper.addLogColoring("PlayerLog", 1);
				Helper.addLogWidgets();
				break;
			}
			break;
		case "marketplace":
			switch (subPageId) {
			case "createreq":
				Helper.addMarketplaceWidgets();
				break;
			}
			break;
		case "quickbuff":
			Helper.injectQuickBuff();
			break;
		case "notepad":
			switch (subPageId) {
			case "showlogs":
				Helper.injectNotepadShowLogs();
				break;
			case "invmanager":
				Helper.injectInventoryManager();
				break;
			case "guildinvmanager":
				Helper.injectGuildInventoryManager();
				break;
			case "recipemanager":
				Helper.injectRecipeManager();
				break;
			case "questmanager":
				Helper.injectQuestManager();
				break;
			case "auctionsearch":
				Helper.injectAuctionSearch();
				break;
			case "onlineplayers":
				Helper.injectOnlinePlayers();
				break;
			case "quicklinkmanager":
				Helper.injectQuickLinkManager();
				break;
			case "monsterlog":
				Helper.injectMonsterLog();
				break;
			}
			break;
		case "points":
			switch (subPageId) {
			case "-":
				Helper.storePlayerUpgrades();
				Helper.injectPoints();
				break;
			}
			break;
		case "trade":
			Helper.retrieveTradeConfirm();
			break;
		case "titan":
			Helper.injectTitan();
			break;
		case "toprated":
			switch (subPageId) {
			case "xp":
				Helper.injectTopRated();
				break;
			}
			break;
		case "inventing":
			switch (subPageId) {
			case "viewrecipe":
				Helper.injectViewRecipe();
				break;
			}
			break;
		case "message":
			Helper.injectMessageTemplate();
			break;
		case "tempinv":
			Helper.injectMailbox();
			break;
		case "-":
			var isRelicPage = System.findNode("//input[contains(@title,'Use your current group to capture the relic')]");
			if (isRelicPage) {
				Helper.injectRelic(isRelicPage);
			}
			var isAuctionPage = System.findNode("//img[contains(@title,'Auction House')]");
			if (isAuctionPage) {
				Helper.injectAuctionHouse();
			}
			var isQuestBookPage = System.findNode("//td[.='Quest Name']");
			if (isQuestBookPage) {
				Helper.injectQuestBookFull();
			}
			var isAdvisorPageClue1 = System.findNode("//font[@size=2 and .='Advisor']");
			var clue2 = "//a[@href='index.php?cmd=guild&amp;subcmd=manage' and .='Back to Guild Management']"
			var isAdvisorPageClue2 = System.findNode(clue2);
			if (isAdvisorPageClue1 && isAdvisorPageClue2) {
				Helper.injectAdvisor(subPage2Id);
			}
			var isArenaTournamentPage = System.findNode("//b[contains(.,'Tournament #')]");
			if (isArenaTournamentPage) {
				Helper.injectTournament();
			}
			break;
		}
	},

	injectGuild: function() {
		var guildMiniSRC = System.findNode("//img[contains(@src,'_mini.jpg')]").getAttribute("src");
		var guildID = /guilds\/(\d+)_mini.jpg/.exec(guildMiniSRC)[1];
		GM_setValue("guildID",guildID);

		var guildLogo = System.findNode("//a[contains(.,'Change Logo')]").parentNode;
		guildLogo.innerHTML += "[ <span style='cursor:pointer; text-decoration:underline;' " +
			"id='toggleGuildLogoControl' linkto='guildLogoControl' title='Toggle Section'>X</span> ]";
		var guildLogoElement = System.findNode("//img[contains(@title, 's Logo')]");
		guildLogoElement.id = "guildLogoControl";
		if (GM_getValue("guildLogoControl")) {
			guildLogoElement.style.display = "none";
			guildLogoElement.style.visibility = "hidden";
		}
		var leaveGuild = System.findNode("//a[contains(.,'Leave')]").parentNode;
		leaveGuild.innerHTML += "[ <span style='cursor:pointer; text-decoration:underline;' " +
			"id='toggleStatisticsControl' linkto='statisticsControl' title='Toggle Section'>X</span> ]";
		var linkElement=System.findNode("//a[@href='index.php?cmd=guild&subcmd=changefounder']");
		statisticsListElement = linkElement.parentNode.parentNode.parentNode.nextSibling.nextSibling.nextSibling.nextSibling.firstChild.nextSibling;
		statisticsListElement.innerHTML = "<span id='statisticsControl'>" + statisticsListElement.innerHTML + "</span>";
		if (GM_getValue("statisticsControl")) {
			var statisticsControl = document.getElementById("statisticsControl");
			statisticsControl.style.display = "none";
			statisticsControl.style.visibility = "hidden";
		}
		var build = System.findNode("//a[contains(.,'Build')]").parentNode;
		build.innerHTML += "[ <span style='cursor:pointer; text-decoration:underline;' " +
			"id='toggleGuildStructureControl' linkto='guildStructureControl' title='Toggle Section'>X</span> ]";
		var linkElement=System.findNode("//a[@href='index.php?cmd=guild&subcmd=structures']");
		structureListElement = linkElement.parentNode.parentNode.parentNode.nextSibling.nextSibling.nextSibling.nextSibling.firstChild.nextSibling;
		structureListElement.innerHTML = "<span id='guildStructureControl'>" + structureListElement.innerHTML + "</span>";
		if (GM_getValue("guildStructureControl")) {
			var guildStructureControl = document.getElementById("guildStructureControl");
			guildStructureControl.style.display = "none";
			guildStructureControl.style.visibility = "hidden";
		}

		document.getElementById('toggleGuildLogoControl').addEventListener('click', System.toggleVisibilty, true);
		document.getElementById('toggleStatisticsControl').addEventListener('click', System.toggleVisibilty, true);
		document.getElementById('toggleGuildStructureControl').addEventListener('click', System.toggleVisibilty, true);

		// Fast Take

		var guildStore = System.findNode("//table[tbody/tr/td[@background='"+System.imageServer+"/inventory/2x3.gif']]");
		var guildStoreIDRE = /guildstore_id=(\d+)/i;

		var guildStoreBox = [];
		var guildStoreBoxItem = [];
		var guildStoreBoxID = [];
		for (var i=0;i<12;i++) {
			if (guildStore.rows[i >> 2]) guildStoreBox[i]=guildStore.rows[i >> 2].cells[i % 4];
			if (guildStoreBox[i]) guildStoreBoxItem[i] = guildStoreBox[i].firstChild;
			if (guildStoreBoxItem[i]) guildStoreBoxID[i] = guildStoreIDRE(guildStoreBoxItem[i].firstChild.getAttribute("href"))[1];
		}

		var newRow;

		for (var i=0;i<12;i++) {
			if ((i % 4==0) && guildStoreBoxItem[i]) newRow = guildStore.insertRow(2*(i >> 2)+1);
			if (guildStoreBoxItem[i]) {
				var newCell = newRow.insertCell(i % 4);
				newCell.innerHTML = '<span style="cursor:pointer; text-decoration:underline; color:blue; font-size:x-small;" '+
					'id="Helper:recallGuildStoreItem' + guildStoreBoxID[i] + '" ' +
					'itemID="' + guildStoreBoxID[i] + '">Fast Take</span>';
				document.getElementById('Helper:recallGuildStoreItem' + guildStoreBoxID[i])
					.addEventListener('click', Helper.recallGuildStoreItem, true);
			}
		}
	},

	recallGuildStoreItem: function(evt) {
		var guildStoreID=evt.target.getAttribute("itemID");
		System.xmlhttp("index.php?cmd=guild&subcmd=inventory&subcmd2=takeitem&guildstore_id=" + guildStoreID,
			Helper.recallGuildStoreItemReturnMessage,
			{"item": guildStoreID, "target": evt.target});
	},

	recallGuildStoreItemReturnMessage: function(responseText, callback) {
		var itemID = callback.item;
		var target = callback.target;
		var info = Layout.infoBox(responseText);
		var itemCellElement = target.parentNode; //System.findNode("//td[@title='" + itemID + "']");
		if (info.search("You successfully took the item into your backpack") != -1) {
			itemCellElement.innerHTML = "<span style='color:green; font-weight:bold;'>Taken</span>";
		} else {
			itemCellElement.innerHTML = "<span style='color:red; font-weight:bold;'>Error:" + info + "</span>";
		}
	},

	injectStaminaCalculator: function() {
		var staminaImageElement = System.findNode("//img[contains(@src,'/skin/icon_stamina.gif')]");
		if (!staminaImageElement) return;

		var mouseoverText = staminaImageElement.getAttribute("onmouseover");
		var staminaRE = /Stamina:\s<\/td><td width=\\'90%\\'>([,0-9]+)\s\/\s([,0-9]+)<\/td>/
		var curStamina = System.intValue(staminaRE.exec(mouseoverText)[1]);
		var maxStamina = System.intValue(staminaRE.exec(mouseoverText)[2]);
		var gainPerHourRE = /Gain\sPer\sHour:\s<\/td><td width=\\'90%\\'>\+([,0-9]+)<\/td>/
		var gainPerHour = System.intValue(gainPerHourRE.exec(mouseoverText)[1]);
		var nextGainRE = /Next\sGain\s:\s<\/td><td width=\\'90%\\'>([,0-9]+)m/
		var nextGainMinutes = System.intValue(nextGainRE.exec(mouseoverText)[1]);
		nextGainHours = nextGainMinutes/60;
		//get the max hours to still be inside stamina maximum
		var hoursToMaxStamina = Math.floor((maxStamina - curStamina)/gainPerHour);
		var millisecondsToMaxStamina = 1000*60*60*(hoursToMaxStamina + nextGainHours);
		var now = (new Date()).getTime();
		var nextHuntMilliseconds = (now + millisecondsToMaxStamina);

		var d = new Date(nextHuntMilliseconds);
		var nextHuntTimeText = d.toFormatString("HH:mm ddd dd/MMM/yyyy");
		var newPart = "<tr><td><font color=\\'#FFF380\\'>Max Stam At: </td><td width=\\'90%\\'>" +
			nextHuntTimeText + "</td></tr><tr>";
		var newMouseoverText = mouseoverText.replace("</table>", newPart + "</table>");
		//newMouseoverText = newMouseoverText.replace(/\s:/,":"); //this breaks the fallen sword addon, so removing this line.
		staminaImageElement.setAttribute("onmouseover", newMouseoverText);
	},

	injectLevelupCalculator: function() {
		var levelupImageElement = System.findNode("//img[contains(@src,'/skin/icon_xp.gif')]");
		if (!levelupImageElement) return;
		var mouseoverText = levelupImageElement.getAttribute("onmouseover");
		var remainingXPRE = /Remaining:\s<\/td><td width=\\\'90%\\\'>([0-9,]+)/i;
		var gainRE = /Gain\sPer\sHour:\s<\/td><td width=\\\'90%\\\'>\+([0-9,]+)/i;
		var nextGainRE = /Next\sGain\s*:\s*<\/td><td width=\\\'90%\\\'>([0-9]*)m\s*([0-9]*)s/i
		var remainingXP = parseInt(remainingXPRE.exec(mouseoverText)[1].replace(/,/g,""));
		var gain = parseInt(gainRE.exec(mouseoverText)[1].replace(/,/g,""));
		var nextGainMin = parseInt(nextGainRE.exec(mouseoverText)[1]);
		var nextGainSec = parseInt(nextGainRE.exec(mouseoverText)[1]);
		var hoursToNextLevel = Math.ceil(remainingXP/gain);
		var millisecsToNextGain = (hoursToNextLevel*60*60+nextGainMin*60+nextGainSec)*1000;

		var nextGainTime  = new Date((new Date()).getTime() + millisecsToNextGain);
		var mouseoverTextAddition = "<tr><td><font color=\\'#FFF380\\'>Next Level At: </td><td width=\\'90%\\'>" +
			nextGainTime.toFormatString("HH:mm ddd dd/MMM/yyyy") + "</td></tr><tr>";
		newMouseoverText = mouseoverText.replace("</table>", mouseoverTextAddition + "</table>");
		newMouseoverText = newMouseoverText.replace("tt_setWidth(175)", "tt_setWidth(200)");
		levelupImageElement.setAttribute("onmouseover", newMouseoverText);
		return;
	},

	injectRelic: function(isRelicPage) {
		var relicNameElement = System.findNode("//td[contains(.,'Below is the current status for the relic')]/b");
		relicNameElement.parentNode.style.fontSize = "x-small";
		var buttonElement = System.findNode("//input[@value='Attempt Group Capture']");
		var injectHere = buttonElement.parentNode;
		injectHere.align = 'center';
		injectHere.innerHTML = '<input id="calculatedefenderstats" type="button" value="Calculate Defender Stats" title="Calculate the stats of the players defending the relic." ' +
			'class="custombutton">' + injectHere.innerHTML;

		document.getElementById('calculatedefenderstats').addEventListener('click', Helper.calculateRelicDefenderStats, true);
	},

	calculateRelicDefenderStats: function(evt) {
		var calcButton = System.findNode("//input[@id='calculatedefenderstats']");
		calcButton.style.visibility = "hidden";
		var relicNameElement = System.findNode("//td[contains(.,'Below is the current status for the relic')]/b");
		relicNameElement.parentNode.style.fontSize = "x-small";
		var tableElement = System.findNode("//table[@width='600']");
		for (var i=0;i<tableElement.rows.length;i++) {
			var aRow = tableElement.rows[i];
			if (i==2 ||
				i==3 || //Relic picture
				i==4 ||
				i==5 || //back to world
				i==6 ||
				i==7 || //Relic instructions
				i==8 ||
				i==10 ||
				i==11) { // attempt group capture button
				aRow.firstChild.colSpan = '3';
			}
		}
		var relicName = relicNameElement.innerHTML;
		var tableWithBorderElement = System.findNode("//table[@cellpadding='5']");
		tableWithBorderElement.align = "left";
		tableWithBorderElement.parentNode.colSpan = "2";
		var tableInsertPoint = tableWithBorderElement.parentNode.parentNode;
		tableInsertPoint.innerHTML += "<td colspan='1'><table width='200' style='border:1px solid #A07720;'>" +
			"<tbody><tr><td title='InsertSpot'></td></tr></tbody></table></td>";
		var extraTextInsertPoint = System.findNode("//td[@title='InsertSpot']");
		var defendingGuild = System.findNode("//a[contains(@href,'index.php?cmd=guild&subcmd=view&guild_id=')]");
		var defendingGuildHref = defendingGuild.getAttribute("href");
		Helper.getRelicGuildData(extraTextInsertPoint,defendingGuildHref);

		var defendingGuildMiniSRC = System.findNode("//img[contains(@src,'_mini.jpg')]").getAttribute("src");
		var defendingGuildID = /guilds\/(\d+)_mini.jpg/.exec(defendingGuildMiniSRC)[1];
		var myGuildID = GM_getValue("guildID");

		if (defendingGuildID == myGuildID) {
			var validMemberString = "";
			var memberList = System.getValueJSON("memberlist");
			if (memberList) {
				for (var i=0;i<memberList.members.length;i++) {
					var member=memberList.members[i];
					if (member.status == "Offline"
						&& (member.level < 400 || (member.level > 421 && member.level < 441 ) || member.level > 450)) {
						validMemberString += member.name + " ";
					}
				}
			}
		}

		var listOfDefenders = System.findNodes("//b/a[contains(@href,'index.php?cmd=profile&player_id=')]");
		var defenderCount = 0;
		var testList = "";
		for (var i=0; i<listOfDefenders.length; i++) {
			var href = listOfDefenders[i].getAttribute("href");
			//if (i<3) { //I put this in to limit the number of calls this function makes.
					//I don't want to hammer the server too much.
				Helper.getRelicPlayerData(defenderCount,extraTextInsertPoint,href);
			//}
			testList += listOfDefenders[i].innerHTML + " ";
			if (defendingGuildID == myGuildID) validMemberString = validMemberString.replace(listOfDefenders[i].innerHTML + " ","");
			defenderCount++;
		}
		//extraTextInsertPoint.innerHTML += "<tr><td style='font-size:x-small;'>" + testList + "<td><tr>";
		extraTextInsertPoint.innerHTML += "<tr><td><table style='font-size:small; border-top:2px black solid;'>" +
			"<tr><td>Number of Defenders:</td><td>" + defenderCount + "</td></tr>" +
			"<tr><td>Defending Guild Relic Count:</td><td title='relicCount'>0</td></tr>" +
			"<tr><td>Lead Defender Bonus:</td><td title='LDPercentage'>0</td></tr>" +
			"<tr style='display:none;'><td>Relic Count Processed:</td><td title='relicProcessed'>0</td></tr>" +
			"<tr><td colspan='2' style='font-size:x-small; color:gray;'>Does not allow for last logged time (yet), but does include Constitution bonus calculation on lead defender</td></tr>" +
			"<tr style='display:none;'><td colspan='2' style='border-top:2px black solid;'>Lead Defender Full Stats</td></tr>" +
			"<tr style='display:none;'><td align='right' style='color:brown;'>Attack:</td><td align='right' title='LDattackValue'>0</td></tr>" +
			"<tr style='display:none;'><td align='right' style='color:brown;'>Defense:</td><td align='right' title='LDdefenseValue'>0</td></tr>" +
			"<tr style='display:none;'><td align='right' style='color:brown;'>Armor:</td><td align='right' title='LDarmorValue'>0</td></tr>" +
			"<tr style='display:none;'><td align='right' style='color:brown;'>Damage:</td><td align='right' title='LDdamageValue'>0</td></tr>" +
			"<tr style='display:none;'><td align='right' style='color:brown;'>HP:</td><td align='right' title='LDhpValue'>0</td></tr>" +
			"<tr style='display:none;'><td align='right' style='color:brown;'>Processed:</td><td align='right' title='LDProcessed'>0</td></tr>" +
			"<tr><td colspan='2' style='border-top:2px black solid;'>Other Defender Stats</td></tr>" +
			"<tr><td align='right' style='color:brown;'>Attack:</td><td align='right' title='attackValue'>0</td></tr>" +
			"<tr><td align='right' style='color:brown;'>Defense:</td><td align='right' title='defenseValue'>0</td></tr>" +
			"<tr><td align='right' style='color:brown;'>Armor:</td><td align='right' title='armorValue'>0</td></tr>" +
			"<tr><td align='right' style='color:brown;'>Damage:</td><td align='right' title='damageValue'>0</td></tr>" +
			"<tr><td align='right' style='color:brown;'>HP:</td><td align='right' title='hpValue'>0</td></tr>" +
			"<tr><td align='right' style='color:brown;'>Processed:</td><td align='right' title='defendersProcessed'>0</td></tr>" +
			"<tr><td style='border-top:2px black solid;' colspan=2>DC adjusted defense values:</td></tr>" +
			"<tr><td style='font-size:x-small;' align='right'>DC225:</td><td style='font-size:x-small;' align='right' title='DC225'>0</td></tr>" +
			"<tr><td style='font-size:x-small;' align='right'>DC175:</td><td style='font-size:x-small;' align='right' title='DC175'>0</td></tr>";
		if (defendingGuildID == myGuildID) {
			extraTextInsertPoint.innerHTML += "<tr><td style='border-top:2px black solid;' colspan=2>Offline guild members not at relic:</td></tr>";
			extraTextInsertPoint.innerHTML += "<tr><td style='font-size:x-small; color:red;' colspan=2>" + validMemberString + "</td></tr>";
		}
		extraTextInsertPoint.innerHTML += "</table><td><tr>";
	},

	getRelicGuildData: function(extraTextInsertPoint,href) {
		System.xmlhttp(href, Helper.parseRelicGuildData, {"extraTextInsertPoint":extraTextInsertPoint,"href":href});
	},

	parseRelicGuildData: function(responseText, callback) {
		var extraTextInsertPoint = callback.extraTextInsertPoint;
		var href = callback.href;
		var doc=System.createDocument(responseText);
		var allItems = doc.getElementsByTagName("IMG");
		var relicCount = 0;
		for (var i=0;i<allItems.length-1;i++) {
			var anItem=allItems[i];
			var mouseoverText = anItem.getAttribute("onmouseover")
			if (mouseoverText && mouseoverText.search("Relic Bonuses") != -1){
				relicCount++;
			}
		}
		var relicCountValue = System.findNode("//td[@title='relicCount']");
		relicCountValue.innerHTML = relicCount;
		var relicProcessedValue = System.findNode("//td[@title='relicProcessed']");
		relicProcessedValue.innerHTML = 1;
		var relicMultiplier = 1;
		if (relicCount == 1) {
			relicMultiplier = 1.5;
		}
		else if (relicCount >= 3) {
			relicMultiplier = 0.9;
		}
		var LDProcessedValue = System.findNode("//td[@title='LDProcessed']");
		if (LDProcessedValue.innerHTML == "1") {
			var attackValue              = System.findNode("//td[@title='attackValue']");
			var LDattackValue            = System.findNode("//td[@title='LDattackValue']");
			attackNumber                 = System.intValue(attackValue.innerHTML);
			LDattackNumber               = System.intValue(LDattackValue.innerHTML);
			attackValue.innerHTML        = System.addCommas(attackNumber + Math.round(LDattackNumber*relicMultiplier));
			var defenseValue             = System.findNode("//td[@title='defenseValue']");
			var LDdefenseValue           = System.findNode("//td[@title='LDdefenseValue']");
			defenseNumber                = System.intValue(defenseValue.innerHTML);
			LDdefenseNumber              = System.intValue(LDdefenseValue.innerHTML);
			var overallDefense           = defenseNumber + Math.round(LDdefenseNumber*relicMultiplier)
			defenseValue.innerHTML       = System.addCommas(overallDefense);
			var dc225                    = System.findNode("//td[@title='DC225']");
			var dc175                    = System.findNode("//td[@title='DC175']");
			dc225.innerHTML              = System.addCommas(Math.ceil(overallDefense * (1 - (225 * 0.002))));
			dc175.innerHTML              = System.addCommas(Math.ceil(overallDefense * (1 - (175 * 0.002))));
			var armorValue               = System.findNode("//td[@title='armorValue']");
			var LDarmorValue             = System.findNode("//td[@title='LDarmorValue']");
			armorNumber                  = System.intValue(armorValue.innerHTML);
			LDarmorNumber                = System.intValue(LDarmorValue.innerHTML);
			armorValue.innerHTML         = System.addCommas(armorNumber + Math.round(LDarmorNumber*relicMultiplier));
			var damageValue              = System.findNode("//td[@title='damageValue']");
			var LDdamageValue            = System.findNode("//td[@title='LDdamageValue']");
			damageNumber                 = System.intValue(damageValue.innerHTML);
			LDdamageNumber               = System.intValue(LDdamageValue.innerHTML);
			damageValue.innerHTML        = System.addCommas(damageNumber + Math.round(LDdamageNumber*relicMultiplier));
			var hpValue                  = System.findNode("//td[@title='hpValue']");
			var LDhpValue                = System.findNode("//td[@title='LDhpValue']");
			hpNumber                     = System.intValue(hpValue.innerHTML);
			LDhpNumber                   = System.intValue(LDhpValue.innerHTML);
			hpValue.innerHTML            = System.addCommas(hpNumber + Math.round(LDhpNumber*relicMultiplier));
			var defendersProcessed       = System.findNode("//td[@title='defendersProcessed']");
			defendersProcessedNumber     = System.intValue(defendersProcessed.innerHTML);
			defendersProcessed.innerHTML = System.addCommas(defendersProcessedNumber + 1);
			var LDpercentageValue        = System.findNode("//td[@title='LDPercentage']");
			LDpercentageValue.innerHTML  = (relicMultiplier*100) + "%";
		}
	},

	getRelicPlayerData: function(defenderCount,extraTextInsertPoint,href) {
		System.xmlhttp(href, Helper.parseRelicPlayerData, {"defenderCount": defenderCount, "extraTextInsertPoint": extraTextInsertPoint, "href": href});
	},

	parseRelicPlayerData: function(responseText, callback) {
		var defenderCount = callback.defenderCount;
		var extraTextInsertPoint = callback.extraTextInsertPoint;
		var href = callback.href;
		var doc = System.createDocument(responseText);
		var allItems = doc.getElementsByTagName("B");
		var playerAttackValue = 0, playerDefenseValue = 0, playerArmorValue = 0, playerDamageValue = 0, playerHPValue = 0;
		for (var i=0;i<allItems.length;i++) {
			var anItem=allItems[i];
			if (anItem.innerHTML == "Attack:&nbsp;"){
				var attackText = anItem;
				var attackLocation = attackText.parentNode.nextSibling.firstChild.firstChild.firstChild.firstChild;
				playerAttackValue = attackLocation.textContent;
				var defenseText = attackText.parentNode.nextSibling.nextSibling.nextSibling.firstChild;
				var defenseLocation = defenseText.parentNode.nextSibling.firstChild.firstChild.firstChild.firstChild;
				playerDefenseValue = defenseLocation.textContent;
				var armorText = defenseText.parentNode.parentNode.nextSibling.nextSibling.firstChild.nextSibling.firstChild;
				var armorLocation = armorText.parentNode.nextSibling.firstChild.firstChild.firstChild.firstChild;
				playerArmorValue = armorLocation.textContent;
				var damageText = armorText.parentNode.nextSibling.nextSibling.nextSibling.firstChild;
				var damageLocation = damageText.parentNode.nextSibling.firstChild.firstChild.firstChild.firstChild;
				playerDamageValue = damageLocation.textContent;
				var hpText = damageText.parentNode.parentNode.nextSibling.nextSibling.firstChild.nextSibling.firstChild;
				var hpLocation = hpText.parentNode.nextSibling.firstChild.firstChild.firstChild.firstChild;
				playerHPValue = hpLocation.textContent;
			}
		}

		if (defenderCount != 0) {
			var defenderMultiplier       = 0.2;
			var attackValue              = System.findNode("//td[@title='attackValue']");
			attackNumber                 = System.intValue(attackValue.innerHTML);
			attackValue.innerHTML        = System.addCommas(attackNumber + Math.round(playerAttackValue*defenderMultiplier));
			var defenseValue             = System.findNode("//td[@title='defenseValue']");
			defenseNumber                = System.intValue(defenseValue.innerHTML);
			var overallDefense           = defenseNumber + Math.round(playerDefenseValue*defenderMultiplier);
			defenseValue.innerHTML       = System.addCommas(overallDefense);
			var dc225                    = System.findNode("//td[@title='DC225']");
			var dc175                    = System.findNode("//td[@title='DC175']");
			dc225.innerHTML              = System.addCommas(Math.ceil(overallDefense * (1 - (225 * 0.002))));
			dc175.innerHTML              = System.addCommas(Math.ceil(overallDefense * (1 - (175 * 0.002))));
			var armorValue               = System.findNode("//td[@title='armorValue']");
			armorNumber                  = System.intValue(armorValue.innerHTML);
			armorValue.innerHTML         = System.addCommas(armorNumber + Math.round(playerArmorValue*defenderMultiplier));
			var damageValue              = System.findNode("//td[@title='damageValue']");
			damageNumber                 = System.intValue(damageValue.innerHTML);
			damageValue.innerHTML        = System.addCommas(damageNumber + Math.round(playerDamageValue*defenderMultiplier));
			var hpValue                  = System.findNode("//td[@title='hpValue']");
			hpNumber                     = System.intValue(hpValue.innerHTML);
			hpValue.innerHTML            = System.addCommas(hpNumber + Math.round(playerHPValue*defenderMultiplier));
			var defendersProcessed       = System.findNode("//td[@title='defendersProcessed']");
			defendersProcessedNumber     = System.intValue(defendersProcessed.innerHTML);
			defendersProcessed.innerHTML = System.addCommas(defendersProcessedNumber + 1);
		}
		else {
			//get relavent buffs here later ... just Constitution atm
			var allItems = doc.getElementsByTagName("IMG");
			var constitutionLevel = 0;
			for (var i=0;i<allItems.length;i++) {
				var anItem=allItems[i];
				if (anItem.getAttribute("src").search("/skills/") != -1) {
					var onmouseover = anItem.getAttribute("onmouseover")
					var constitutionRE = /<b>Constitution<\/b> \(Level: (\d+)\)/
					var constitution =  constitutionRE.exec(onmouseover);
					if (constitution) {
						constitutionLevel = constitution[1];
						break;
					}
				}
			}

			var defenderMultiplier = 1;
			var attackValue = System.findNode("//td[@title='LDattackValue']");
			attackNumber = System.intValue(attackValue.innerHTML);
			attackValue.innerHTML = System.addCommas(attackNumber + Math.round(playerAttackValue*defenderMultiplier));
			var defenseValue = System.findNode("//td[@title='LDdefenseValue']");
			defenseNumber = System.intValue(defenseValue.innerHTML);
			playerDefenseValue = Math.ceil(System.intValue(playerDefenseValue) * (1 + constitutionLevel * 0.001));
			defenseValue.innerHTML = System.addCommas(defenseNumber + Math.round(playerDefenseValue*defenderMultiplier));
			var armorValue = System.findNode("//td[@title='LDarmorValue']");
			armorNumber=System.intValue(armorValue.innerHTML);
			armorValue.innerHTML = System.addCommas(armorNumber + Math.round(playerArmorValue*defenderMultiplier));
			var damageValue = System.findNode("//td[@title='LDdamageValue']");
			damageNumber=System.intValue(damageValue.innerHTML);
			damageValue.innerHTML = System.addCommas(damageNumber + Math.round(playerDamageValue*defenderMultiplier));
			var hpValue = System.findNode("//td[@title='LDhpValue']");
			hpNumber=System.intValue(hpValue.innerHTML);
			hpValue.innerHTML = System.addCommas(hpNumber + Math.round(playerHPValue*defenderMultiplier));
			var defendersProcessed = System.findNode("//td[@title='LDProcessed']");
			defendersProcessedNumber=System.intValue(defendersProcessed.innerHTML);
			defendersProcessed.innerHTML = System.addCommas(defendersProcessedNumber + 1);

		}
		var relicProcessedValue = System.findNode("//td[@title='relicProcessed']");
		var relicCountValue = System.findNode("//td[@title='relicCount']");
		var relicCount = System.intValue(relicCountValue.innerHTML);

		var relicMultiplier = 1;
		if (relicCount == 1) {
			relicMultiplier = 1.5;
		}
		else if (relicCount >= 3) {
			relicMultiplier = 0.9;
		}

		if (defenderCount == 0 && relicProcessedValue.innerHTML == "1") {
			var attackValue              = System.findNode("//td[@title='attackValue']");
			var LDattackValue            = System.findNode("//td[@title='LDattackValue']");
			attackNumber                 = System.intValue(attackValue.innerHTML);
			LDattackNumber               = System.intValue(LDattackValue.innerHTML);
			attackValue.innerHTML        = System.addCommas(attackNumber + Math.round(LDattackNumber*relicMultiplier));
			var defenseValue             = System.findNode("//td[@title='defenseValue']");
			var LDdefenseValue           = System.findNode("//td[@title='LDdefenseValue']");
			defenseNumber                = System.intValue(defenseValue.innerHTML);
			LDdefenseNumber              = System.intValue(LDdefenseValue.innerHTML);
			var overallDefense           = defenseNumber + Math.round(LDdefenseNumber*relicMultiplier)
			defenseValue.innerHTML       = System.addCommas(overallDefense);
			var dc225                    = System.findNode("//td[@title='DC225']");
			var dc175                    = System.findNode("//td[@title='DC175']");
			dc225.innerHTML              = System.addCommas(Math.ceil(overallDefense * (1 - (225 * 0.002))));
			dc175.innerHTML              = System.addCommas(Math.ceil(overallDefense * (1 - (175 * 0.002))));
			var armorValue               = System.findNode("//td[@title='armorValue']");
			var LDarmorValue             = System.findNode("//td[@title='LDarmorValue']");
			armorNumber                  = System.intValue(armorValue.innerHTML);
			LDarmorNumber                = System.intValue(LDarmorValue.innerHTML);
			armorValue.innerHTML         = System.addCommas(armorNumber + Math.round(LDarmorNumber*relicMultiplier));
			var damageValue              = System.findNode("//td[@title='damageValue']");
			var LDdamageValue            = System.findNode("//td[@title='LDdamageValue']");
			damageNumber                 = System.intValue(damageValue.innerHTML);
			LDdamageNumber               = System.intValue(LDdamageValue.innerHTML);
			damageValue.innerHTML        = System.addCommas(damageNumber + Math.round(LDdamageNumber*relicMultiplier));
			var hpValue                  = System.findNode("//td[@title='hpValue']");
			var LDhpValue                = System.findNode("//td[@title='LDhpValue']");
			hpNumber                     = System.intValue(hpValue.innerHTML);
			LDhpNumber                   = System.intValue(LDhpValue.innerHTML);
			hpValue.innerHTML            = System.addCommas(hpNumber + Math.round(LDhpNumber*relicMultiplier));
			var defendersProcessed       = System.findNode("//td[@title='defendersProcessed']");
			defendersProcessedNumber     = System.intValue(defendersProcessed.innerHTML);
			defendersProcessed.innerHTML = System.addCommas(defendersProcessedNumber + 1);
			var LDpercentageValue        = System.findNode("//td[@title='LDPercentage']");
			LDpercentageValue.innerHTML  = (relicMultiplier*100) + "%";
		}
	},

	position: function() {
		var result = {};
		if (Helper.page=="world/map/-(-)") {
			var playerTile=System.findNode("//img[contains(@src,'player_tile.gif')]/../../../../../..");
			result.X=playerTile.cellIndex;
			result.Y=playerTile.parentNode.rowIndex;
			result.type="worldmap";
		}
		else {
			var posit = System.findNode("//td[contains(@background,'/skin/realm_top_b4.jpg')]/center/nobr/font");
			if (!posit) return;
			var thePosition=posit.innerHTML;
			var positionRE=/\((\d+),\s*(\d+)\)/
			var positionX = parseInt(thePosition.match(positionRE)[1]);
			var positionY = parseInt(thePosition.match(positionRE)[2]);
			result.X=positionX;
			result.Y=positionY;
			result.type="normal";
		}
		return result
	},

	mapThis: function() {
		var realm = System.findNode("//td[contains(@background,'/skin/realm_top_b2.jpg')]/center/nobr/b");
		var posit = Helper.position();

		if ((realm) && (posit)) {
			var levelName=realm.innerHTML;
			Helper.levelName = levelName;
			var theMap = System.getValueJSON("map")
			if (!theMap) {
				theMap = {};
				theMap["levels"] = {};
			}
			if (!theMap["levels"][levelName]) theMap["levels"][levelName] = {};
			if (!theMap["levels"][levelName][posit.X]) theMap["levels"][levelName][posit.X]={};
			theMap["levels"][levelName][posit.X][posit.Y]="!";
			System.setValueJSON("map", theMap);
		}
	},

	showMap: function(isLarge) {
		if (!GM_getValue("footprints")) return;
		if (isLarge) {
			var realm = System.findNode("//b");
			Helper.levelName = realm.textContent.replace(" Map Overview", "");
		}
		// GM_log(Helper.levelName);
		var theMap = System.getValueJSON("map");
		var displayedMap = System.findNode(isLarge ? "//table[@width]" : "//table[@width='200']");
		var footprintsColor = GM_getValue("footprintsColor");
		var posit = Helper.position();

		for (var y = 0; y < displayedMap.rows.length; y++) {
			var aRow = displayedMap.rows[y];
			for (var x = 0; x < aRow.cells.length; x++) {
				var aCell = aRow.cells[x];
				var dx = isLarge ? x : posit.X + (x - 2);
				var dy = isLarge ? y : posit.Y + (y - 2);
				// GM_log(dx + ":" + dy)
				if (theMap["levels"][Helper.levelName] && theMap["levels"][Helper.levelName][dx] && theMap["levels"][Helper.levelName][dx][dy] && (theMap["levels"][Helper.levelName][dx][dy] == "!")) {
					// aCell.setAttribute("background", "http://66.7.192.165/tiles/9_50.gif");

					if (x != (isLarge ? posit.X : 2) || y != (isLarge ? posit.Y : 2)) {
						aCell.style.color = footprintsColor;
						if (aCell.innerHTML.indexOf("table") > 0)
							aCell.firstChild.firstChild.firstChild.firstChild.firstChild.innerHTML +="**";
						else
							aCell.innerHTML+="**";
					};

									}
				// GM_log(x + ":" + y + " >> " + aCell.getAttribute("background"));
			}
		}
	},

	injectViewRecipe: function() {
		var components = System.findNodes("//b[.='Components Required']/../../following-sibling::tr[2]//img");
		for (var i = 0; i < components.length; i++) {
			var mo = components[i].getAttribute("onmouseover");
			System.xmlhttp(Helper.linkFromMouseoverCustom(mo), Helper.injectViewRecipeLinks, components[i]);
		}
	},

	injectViewRecipeLinks: function(responseText, callback) {
		var itemRE = /<b>([^<]+)<\/b>/i;
		var itemName = itemRE.exec(responseText);
		if (itemName) itemName=itemName[1];
		var itemLinks = document.createElement("td");
		itemLinks.innerHTML =
			'<a href="' + System.server + '?cmd=auctionhouse&type=-1&order_by=1&search_text='
			+ escape(Data.plantFromComponent(itemName))
			+ '">AH</a>';
		var counter=System.findNode("../../../../tr[2]/td", callback);
		counter.setAttribute("colspan", "2");
		callback.parentNode.parentNode.parentNode.appendChild(itemLinks);
	},

	injectAdvisor: function(subPage2Id) {
		var titleCells=System.findNodes("//tr[td/b='Member']/td");
		if (!titleCells) return;
		var parentTables=System.findNodes("ancestor::table", titleCells[0]);
		var list=parentTables[parentTables.length-1];

		// insert weekly summary link
		var injectHere=System.findNode("//td/select/..");
		if (injectHere) {
			var elem=document.createElement("span");
			elem.innerHTML=" <a href='index.php?cmd=guild&subcmd=advisor&subcmd2=weekly'>7-Day Summary</a>";
			injectHere.appendChild(elem);
		}
		GM_addStyle(
			'.HelperAdvisorRow1 {background-color:#e7c473;font-size:x-small}\n' +
			'.HelperAdvisorRow1:hover {background-color:white}\n' +
			'.HelperAdvisorRow2 {background-color:#e2b960;font-size:x-small}\n' +
			'.HelperAdvisorRow2:hover {background-color:white}');

		var memberList = System.getValueJSON("memberlist");
		if (memberList) Helper.generateAdvisorRows(list);

		if (! Helper.advisorHeader) {
			Helper.advisorHeader = '<tr>';
			var titleCells = ["Member", "Lvl", "Rank", "Gold From Deposits", "Gold From Tax", "Gold Total", "FSPs", "Skills Cast", "Groups Created", "Groups Joined", "Relics Captured", "XP Contrib"];
			for (var i=0; i<titleCells.length; i++) {
				Helper.advisorHeader += "<th bgcolor=#cd9e4b align=center width=8% style='text-decoration: underline; cursor: pointer; font-size:x-small;'>" + titleCells[i] + "</td>";
			}
			Helper.advisorHeader += '</tr>';
		}

		if (! Helper.advisorFooter) {
			Helper.advisorFooter = '<tr><td colspan=3 align=right>Total: </td>';
			for (var i=1; i<list.rows[list.rows.length-1].cells.length; i++) {
				Helper.advisorFooter += "<td align=center>" + list.rows[list.rows.length-1].cells[i].innerHTML + '</td>';
			}
			Helper.advisorFooter +='</tr>';
		}
		if (subPage2Id!='-') {
			Helper.advisorFooter='';
		}

		Helper.sortAsc = true;
		if (subPage2Id == '-' && memberList) {
			Helper.generateAdvisorRows(list);
			Helper.sortAdvisor(list, "Member");
		} else if (memberList){
			list.innerHTML='Retrieving daily data ...';
			Helper.generateWeeklyAdvisorRows('',{'day':0,'inject':list});
		}		
	},
	
	generateWeeklyAdvisorRows: function(responseText, callback) {
		var day=callback.day;
		if (day <= 7) {
			if (day > 0) {
				callback.inject.innerHTML+=' day '+day+',';
				var doc=System.createDocument(responseText);
				var titleCells=System.findNodes("//tr[td/b='Member']/td",doc);
				if (!titleCells) return;
				var parentTables=System.findNodes("ancestor::table", titleCells[0],doc);
				var list=parentTables[parentTables.length-1];
				Helper.generateAdvisorRows(list);
				if (day == 1) {
					Helper.weeklyAdvisorRows = Helper.advisorRows;
					Helper.advisorColumns = ['GoldFromDeposits','GoldFromTax',
						'GoldTotal','FSPs','SkillsCast','GroupsCreated',
						'GroupsJoined','RelicsCaptured','XPContrib'];
				}
				for (var i=1; i<list.rows.length-1; i++){
					for (var id=0; id<Helper.advisorColumns.length; id++){
						var columnName=Helper.advisorColumns[id];
						if (day==1)
							Helper.weeklyAdvisorRows[i-1][columnName]=
								System.intValue(Helper.weeklyAdvisorRows[i-1][columnName]);
						else
							Helper.weeklyAdvisorRows[i-1][columnName]+=
								System.intValue(Helper.advisorRows[i-1][columnName]);
					}
				}
			}
			System.xmlhttp("index.php?cmd=guild&subcmd=advisor&period="+(day+1), 
				Helper.generateWeeklyAdvisorRows, {'day':(day+1),'inject':callback.inject});
		} else {
			Helper.advisorRows = Helper.weeklyAdvisorRows;
			for (var i=1; i<=Helper.advisorRows.length; i++){
				for (var id=0; id<Helper.advisorColumns.length; id++){
					var columnName=Helper.advisorColumns[id];
					Helper.advisorRows[i-1][columnName]=
						System.addCommas(Helper.advisorRows[i-1][columnName]);
				}
			}
			Helper.sortAdvisor(callback.inject, "Member");
		}
	},

	generateAdvisorRows: function(list) {
		Helper.advisorRows = [];
		var memberList = System.getValueJSON("memberlist");
		for (var i=1; i<list.rows.length-1; i++){
			var theRow=list.rows[i];
			var name = theRow.cells[0].textContent.replace(/\s/, "");
			for (var j=0; j<memberList.members.length; j++) {
				if (memberList.members[j].name == name) {
					var member = memberList.members[j];
					break;
				}
			}
			Helper.advisorRows[i-1] = {
				'Id':(member != undefined ? member.id : -1),
				'Member': theRow.cells[0].textContent,
				'Lvl':(member != undefined ? member.level : -1),
				'Rank':(member != undefined ? member.rank : ""),
				'GoldFromDeposits': theRow.cells[1].textContent,
				'GoldFromTax': theRow.cells[2].textContent,
				'GoldTotal': theRow.cells[3].textContent,
				'FSPs': theRow.cells[4].textContent,
				'SkillsCast': theRow.cells[5].textContent,
				'GroupsCreated': theRow.cells[6].textContent,
				'GroupsJoined': theRow.cells[7].textContent,
				'RelicsCaptured': theRow.cells[8].textContent,
				'XPContrib': theRow.cells[9].textContent
			};
		}
	},

	advisorHeaderClicked: function(evt) {
		var headerClicked=evt.target.textContent;
		var parentTables=System.findNodes("ancestor::table", evt.target)
		var list=parentTables[parentTables.length-1];
		Helper.sortAdvisor(list, headerClicked.replace(/ /g, ""));
	},

	sortAdvisor: function(list, sortBy) {
		if (Helper.sortAsc==undefined) Helper.sortAsc=true;
		if (Helper.sortBy && Helper.sortBy==sortBy) {
			Helper.sortAsc=!Helper.sortAsc;
		}
		Helper.sortBy=sortBy;

		if (sortBy=="Member" || sortBy=="Rank") {
			Helper.advisorRows.sort(Helper.stringSort)
		}
		else {
			Helper.advisorRows.sort(Helper.numberSort)
		}

		var result = Helper.advisorHeader;

		for (var i=0; i<Helper.advisorRows.length; i++){
			var r = Helper.advisorRows[i];
			result += '<tr class="HelperAdvisorRow'+(1+i % 2)+'">'+
			'<td> <a href="index.php?cmd=profile&player_id=' + r.Id +'">' +r.Member+ '</a></td>'+
			'<td align="center"> '+r.Lvl+'</td>'+
			'<td align="center"> '+r.Rank.substr(0,9)+ (r.Rank.length>9 ? '...' : '') + '</td>'+
			'<td align="center">'+r.GoldFromDeposits+'</td>'+
			'<td align="center">'+r.GoldFromTax+'</td>'+
			'<td align="center">'+r.GoldTotal+'</td>'+
			'<td align="center">'+r.FSPs+'</td>'+
			'<td align="center">'+r.SkillsCast+'</td>'+
			'<td align="center">'+r.GroupsCreated+'</td>'+
			'<td align="center">'+r.GroupsJoined+'</td>'+
			'<td align="center">'+r.RelicsCaptured+'</td>'+
			'<td align="center">'+r.XPContrib+'</td></tr>';
		}
		if (Helper.advisorFooter!='')
			result+=Helper.advisorFooter;
		else {
			Helper.advisorFooter='<tr><td align="right" colspan="3">Total: </td>';
			for (var id=0; id<Helper.advisorColumns.length; id++){
				var sum=0;
				var columnName=Helper.advisorColumns[id];
				for (var i=0; i<Helper.advisorRows.length; i++)
					sum+=System.intValue(Helper.advisorRows[i][columnName]);
				Helper.advisorFooter+='<td align="center" style="text-decoration:underline;font-weight:bold;font-size:x-small">'+System.addCommas(sum)+'</td>';
			}
			Helper.advisorFooter+='</tr>';
			result+=Helper.advisorFooter;
		}

		list.innerHTML=result;

		for (var i=0; i<list.rows[0].cells.length; i++) {
			var cell=list.rows[0].cells[i];
			cell.style.textDecoration="underline";
			cell.style.cursor="pointer";
			cell.addEventListener('click', Helper.advisorHeaderClicked, true);
		}

	},

	stringSort: function(a,b) {
		var result=0;
		if (a[Helper.sortBy].toLowerCase()<b[Helper.sortBy].toLowerCase()) result=-1;
		if (a[Helper.sortBy].toLowerCase()>b[Helper.sortBy].toLowerCase()) result=+1;
		if (!Helper.sortAsc) result=-result;
		return result;
	},

	numberSort: function(a,b) {
		var result=0;
		var valueA=a[Helper.sortBy];
		var valueB=b[Helper.sortBy];
		if (typeof valueA=="string") valueA=parseInt(valueA.replace(/,/g,"").replace(/#/g,""));
		if (typeof valueB=="string") valueB=parseInt(valueB.replace(/,/g,"").replace(/#/g,""));
		result = valueA-valueB;
		if (!Helper.sortAsc) result=-result;
		return result;
	},

	questStatusSort: function(a,b) {
		var result=0;
		var valueA,valueB;
		var statuses = ["Incomplete", "Complete", ""];
		if (!a[Helper.sortBy]) {
			valueA=Helper.sortAsc?50:-50
		}
		else {
			valueA=statuses.indexOf(a[Helper.sortBy]);
		}
		if (!b[Helper.sortBy]) {
			valueB=Helper.sortAsc?50:-50
		}
		else {
			valueB=statuses.indexOf(b[Helper.sortBy]);
		}

		result = valueA-valueB;
		if (!Helper.sortAsc) result=-result;
		return result;
	},

	checkBuffs: function() {
		//code to remove buffs but stay on the same screen
		var currentBuffs = System.findNodes("//a[contains(@href,'index.php?cmd=profile&subcmd=removeskill&skill_id=')]");
		if (currentBuffs) {
			for (var i=0;i<currentBuffs.length;i++) {
				var currentBuff = currentBuffs[i];
				var buffHref = currentBuff.getAttribute("href");
				var buffTest = /remove\sthe\s([ a-zA-Z]+)\sskill/.exec(currentBuff.getAttribute("onclick"));
				if (buffTest) {
					var buffName = buffTest[1];
				} else {
					var buffTest = /remove\sthe\s([ a-zA-Z]+)<br>/.exec(currentBuff.getAttribute("onclick"));
					if (buffTest) var buffName = buffTest[1]; else GM_log("Error getting buff");
				}
				var imageHTML = currentBuff.innerHTML;
				var buffCell = currentBuff.parentNode;
				var buffHTML = buffCell.innerHTML;
				var lastPart = buffHTML.substring(buffHTML.indexOf("</a>")+4, buffHTML.length);
				var newCellContents = '<span id="Helper:removeSkill' + i + '" style="cursor:pointer;" buffName="' + buffName + '" buffHref="' + buffHref + '">' + imageHTML + 
					'</span>' + lastPart;
				buffCell.innerHTML = newCellContents;
				buffCell.firstChild.addEventListener('click', Helper.removeSkill, true);
			}
		}

		//extra world screen text
		var replacementText = "<td background='" + System.imageServer + "/skin/realm_right_bg.jpg'>"
		replacementText += "<table width='280' cellpadding='1' style='margin-left:28px; margin-right:28px; " +
			"font-size:medium; border-spacing: 1px; border-collapse: collapse;'>"
		replacementText += "<tr><td colspan='2' height='10'></td></tr><tr><tr><td height='1' bgcolor='#393527' " +
			"colspan='2'></td></tr>";
		var hasShieldImp = System.findNode("//img[contains(@onmouseover,'Summon Shield Imp')]");
		var hasDeathDealer = System.findNode("//img[contains(@onmouseover,'Death Dealer')]");
		if (hasDeathDealer || hasShieldImp) {
			var re=/(\d) HP remaining/;
			var impsRemaining = 0;
			if (hasShieldImp) {
				//textToTest = "tt_setWidth(105); Tip('<center><b>Summon Shield Imp<br>2 HP remaining<br></b> (Level: 150)</b><br>[Click to De-Activate]</center>');";
				textToTest = hasShieldImp.getAttribute("onmouseover");
				impsRemainingRE = re.exec(textToTest);
				impsRemaining = impsRemainingRE[1];
			}
			var applyImpWarningColor = " style='color:green; font-size:medium;'";
			if (impsRemaining==2){
				applyImpWarningColor = " style='color:Orangered; font-size:medium; font-weight:bold;'";
			}
			if (impsRemaining==1){
				applyImpWarningColor = " style='color:Orangered; font-size:large; font-weight:bold'";
			}
			if (impsRemaining==0){
				applyImpWarningColor = " style='color:red; font-size:large; font-weight:bold'";
			}
			replacementText += "<tr><td" + applyImpWarningColor + ">Shield Imps Remaining: " +  impsRemaining + "</td></tr>"
			if (hasDeathDealer) {
				if (GM_getValue("lastDeathDealerPercentage")==undefined) GM_setValue("lastDeathDealerPercentage", 0);
				if (GM_getValue("lastKillStreak")==undefined) GM_setValue("lastKillStreak", 0);
				var lastDeathDealerPercentage = GM_getValue("lastDeathDealerPercentage");
				var lastKillStreak = GM_getValue("lastKillStreak");
				if (impsRemaining>0 && lastDeathDealerPercentage == 20) {
					replacementText += "<tr><td style='font-size:small; color:black'>Kill Streak: <span findme='killstreak'>&gt;" + System.addCommas(lastKillStreak) +
						"</span> Damage bonus: <span findme='damagebonus'>20</span>%</td></tr>";
				} else {
					replacementText += "<tr><td style='font-size:small; color:navy'>Kill Streak: <span findme='killstreak'>" + System.addCommas(lastKillStreak) +
						"</span> Damage bonus: <span findme='damagebonus'>" + Math.round(lastDeathDealerPercentage*100)/100 + "</span>%</td></tr>";
					System.xmlhttp("index.php?cmd=profile", Helper.getKillStreak);
				}
			}
		}
		var hasCounterAttack = System.findNode("//img[contains(@onmouseover,'Counter Attack')]");
		if (hasCounterAttack) {
			if (hasCounterAttack.getAttribute("src").search("/skills/") != -1) {
				var onmouseover = hasCounterAttack.getAttribute("onmouseover")
				var counterAttackRE = /<b>Counter Attack<\/b> \(Level: (\d+)\)/
				var counterAttack = counterAttackRE.exec(onmouseover);
				if (counterAttack) {
					counterAttackLevel = counterAttack[1];
				}
			}
			replacementText += "<tr><td style='font-size:small; color:blue'>CA" + counterAttackLevel + " active</td></tr>";
		}
		replacementText += "<tr><td colspan='2' height='10'></td></tr><tr><td height='1' bgcolor='#393527' colspan='2'></td></tr>";
		if (GM_getValue("showHuntingBuffs")) {
			var buffs=GM_getValue("huntingBuffs");
			var buffAry=buffs.split(",")
			var missingBuffs = new Array();
			for (var i=0;i<buffAry.length;i++) {
				if (!System.findNode("//img[contains(@onmouseover,'" + buffAry[i].trim() + "')]")) {
					missingBuffs.push(buffAry[i]);
				}
			}
			if (missingBuffs.length>0) {
				replacementText += "<tr><td colspan='2' align='center'><span style='font-size:x-small; color:navy;'>" +
					"You are missing some hunting buffs<br/>("
				replacementText += missingBuffs.join(", ")
				replacementText += ")</span></td></tr>"
			}
			replacementText += "<tr><td colspan='2' height='10'></td></tr><tr><td height='1' bgcolor='#393527' colspan='2'></td></tr>";
			replacementText += "</table>";
		}
		replacementText += "</td>" ;

		var injectHere = System.findNode("//tr[contains(td/img/@src, 'realm_right_bottom.jpg')]/../..");
		if (!injectHere) return;
		//insert after kill all monsters image and text
		newRow=injectHere.insertRow(2);
		newRow.innerHTML=replacementText;
	},

	removeSkill: function(evt) {
		var buffName = evt.target.parentNode.getAttribute("buffName");
		var buffHref = evt.target.parentNode.getAttribute("buffHref");
		if (confirm('Are you sure you wish to remove the ' + buffName + ' skill?')) {
			System.xmlhttp(buffHref, function() {window.location="index.php?cmd=world";})		
		}
	},

	injectQuestBookFull: function() {
		if (!GM_getValue("showCompletedQuests")) return;
		var quests = Data.questMatrix();
		var questTable = System.findNode("//table[@width='100%' and @cellPadding='2']");
		questTable.setAttribute("findme","questTable");
		var questNamesOnPage = [];
		var hideQuests=[];
		if (GM_getValue("hideQuests")) hideQuests=GM_getValue("hideQuestNames").split(",");
		for (var i=0;i<questTable.rows.length;i++) {
			var aRow = questTable.rows[i];
			if (i!=0) {
				if (aRow.cells[0].innerHTML) {
					var questName = aRow.cells[0].firstChild.innerHTML.replace(/  /g," ").trim();
					var insertHere = aRow.cells[0];
					questNamesOnPage.push(questName);
					for (var j=0;j<quests.length;j++) {
						var aCell = aRow.cells[0]
						var imgElement = aCell.nextSibling.firstChild;
						var matrixQuestName = quests[j].questName.replace(/  /g," ").trim();

						// GM_log(questName + "\t" + hideQuests.indexOf(questName));

						if (questName == matrixQuestName && imgElement.getAttribute("title") != "Completed") {
							if (hideQuests.indexOf(matrixQuestName)>=0) {
								aRow.parentNode.removeChild(aRow.nextSibling);
								aRow.parentNode.removeChild(aRow.nextSibling);
								aRow.parentNode.removeChild(aRow.nextSibling);
								aRow.parentNode.removeChild(aRow);
							} else {
								insertHere.innerHTML += " <span style='color:gray;'>Quest level:</span> " +
									"<span style='color:blue;'>" + quests[j].level +
									"</span> <span style='color:gray;'>Quest location:</span> " +
									"<span style='color:blue;'>" + quests[j].location + "</span>";
							}
							break;
						} else if (j==quests.length-1 && imgElement.getAttribute("title") != "Completed") {
							insertHere.innerHTML += " <span style='color:red;'>Quest not in array sorry (or error in array).</span>";
						}
					}
				}
			}
		}
	},

	injectQuestBookLite: function() {
		if (GM_getValue("showCompletedQuests")) return;
		var quests = Data.questMatrix();
		var questTable = System.findNode("//table[@width='100%' and @cellPadding='2']");
		questTable.setAttribute("findme","questTable");
		var hideNextRows = 0;
		var playerQuestList = [];
		var hideQuests=[];
		if (GM_getValue("hideQuests")) hideQuests=GM_getValue("hideQuestNames").split(",");

		for (var i=0;i<questTable.rows.length;i++) {
			var aRow = questTable.rows[i];
			if (i!=0) {
				if (hideNextRows > 0) {
					aRow.style.display = "none";
					hideNextRows --;
				}
				if (aRow.cells[0].innerHTML) {
					var questName = aRow.cells[0].firstChild.innerHTML.trim();
					var insertHere = aRow.cells[0];
					var killThis = false;
					for (var j=0;j<quests.length;j++) {
						var matrixQuestName = quests[j].questName.trim();
						if (questName == matrixQuestName) {
							if (hideQuests.indexOf(matrixQuestName)>=0) {
								aRow.parentNode.removeChild(aRow.nextSibling);
								aRow.parentNode.removeChild(aRow.nextSibling);
								aRow.parentNode.removeChild(aRow.nextSibling);
								aRow.parentNode.removeChild(aRow);
							} else {
								insertHere.innerHTML += " <span style='color:gray;'>Quest level:</span> <span style='color:blue;'>" +
									quests[j].level + "</span> <span style='color:gray;'>Quest location:</span> <span style='color:blue;'>" +
									quests[j].location + "</span>";
							}
							break;
						} else if (j==quests.length) {
							insertHere.innerHTML += " <span style='color:gray;'>Quest not in array sorry.</span>";
						}
					}
					var aCell = aRow.cells[0]
					var imgElement = aCell.nextSibling.firstChild;
					if (imgElement.getAttribute("title") == "Completed") {
						aRow.style.display = "none";
						hideNextRows = 3;
					}
					playerQuestList.push(questName);
				}
			}
			else {
				var questNameCell = aRow.firstChild.nextSibling;
				questNameCell.innerHTML += "&nbsp;&nbsp;<font style='color:blue;'>(Completed quests hidden - " +
					"see preferences to unhide)</font>"
			}
		}

		var currentPageElement = System.findNode("//option[@selected]");
		var pageText = currentPageElement.parentNode.parentNode.innerHTML;
		var lastPageNumberRE = /\&nbsp;of\&nbsp;(\d+)\&nbsp;/
		var lastPageNumber = lastPageNumberRE.exec(pageText)[1]*1;
		newRow = questTable.insertRow(-1);
		newCell = newRow.insertCell(0);
		newCell.colSpan = '2';
		newCell.style.display = 'none';
		newCell.innerHTML = "<span style='color:red;' findme='pagesProcessed'>1</span><span style='color:red;' findme='totalPages'>" + lastPageNumber + "</span>";

		newRow = questTable.insertRow(-1);
		newCell = newRow.insertCell(0);
		newCell.colSpan = '2';
		newCell.style.display = 'none';
		newCell.innerHTML = "<span style='color:red;' findme='playerQuestList'>" + playerQuestList.join() + "</span>";

		var pageCountElement = System.findNode("//select[@class='customselect']");
		//&nbsp;of&nbsp;5&nbsp;
		var pageRE = /\&nbsp;of\&nbsp;(\d+)\&nbsp;/
		var pageCount=parseInt(pageCountElement.parentNode.innerHTML.match(pageRE)[1]);
		for (var i=1;i<pageCount;i++) {
			System.xmlhttp("index.php?cmd=questbook&page=" + i, Helper.injectQuestData);
		}
	},

	injectQuestData: function(responseText) {
		var playerQuestListElement = System.findNode("//span[@findme='playerQuestList']");
		var playerQuestList = playerQuestListElement.innerHTML.split();

		var quests = Data.questMatrix();
		var doc=System.createDocument(responseText)
		var allItems = doc.getElementsByTagName("TD");
		for (var i=0;i<allItems.length;i++) {
			var anItem=allItems[i];
			if (anItem.innerHTML=="Quest Name") {
				var questTable = anItem.parentNode.parentNode;
			}
		}
		var OriginalQuestTable = System.findNode("//table[@findme='questTable']");
		var newRow, newCell;
		var insertNextRows = 0;
		for (var i=1;i<questTable.rows.length;i++) {
			var aRow = questTable.rows[i];
			if (insertNextRows > 0) {
				newRow = OriginalQuestTable.insertRow(OriginalQuestTable.rows.length);
				//newCell=newRow.insertCell(0);
				newRow.innerHTML = aRow.innerHTML;
				insertNextRows --;
			}
			if (aRow.cells[0].innerHTML) {
				var questName = aRow.cells[0].firstChild.textContent.replace(/  /g," ").trim();
				var insertHere = aRow.cells[0];
				for (var j=0;j<quests.length;j++) {
					if (questName == quests[j].questName.trim()) {
						insertHere.innerHTML += " <span style='color:gray;'>Quest level:</span> <span style='color:blue;'>" +
							quests[j].level + "</span> <span style='color:gray;'>Quest location:</span> <span style='color:blue;'>" +
							quests[j].location + "</span>";
					} else if (j==quests.length) {
						insertHere.innerHTML += " <span style='color:gray;'>Quest not in array sorry.</span>";
					}
				}
				var aCell = aRow.cells[0]
				var imgElement = aCell.nextSibling.firstChild;
				if (imgElement.getAttribute("title") != "Completed") {
					newRow = OriginalQuestTable.insertRow(OriginalQuestTable.rows.length);
					newRow.innerHTML = aRow.innerHTML;
					insertNextRows = 3;
				}
				playerQuestList.push(questName);
			}
		}
		var pagesProcessedElement = System.findNode("//span[@findme='pagesProcessed']");
		var pagesProcessed = pagesProcessedElement.textContent*1;
		pagesProcessedElement.innerHTML = pagesProcessed + 1;
		playerQuestListElement.innerHTML = playerQuestList.join();
		var totalPagesElement = System.findNode("//span[@findme='totalPages']");
		var totalPages = totalPagesElement.textContent*1;
		var characterLevel = Helper.characterLevel;
		var pageOneQuestTable = System.findNode("//table[@findme='questTable']");

		if ((pagesProcessed+1) == totalPages) { //all pages processed so now we can find missing quests
			newRow = pageOneQuestTable.insertRow(-1);
			newCell = newRow.insertCell(0);
			newCell.colSpan = '2';
			newCell.innerHTML = "<span style='color:blue;'>List of <u>known</u> missing quests for your level. " +
				"If you find an error with this list, or a missing quest, please report it on the google code page related to this script.</span> ";
			for (var j=0;j<quests.length;j++) {
				var questName = quests[j].questName;
				var questLevel = quests[j].level;
				var questLocation = quests[j].location;
				if (playerQuestList.join().search(questName) == -1 && questLevel <= characterLevel) {
					newRow = pageOneQuestTable.insertRow(-1);
					newCell = newRow.insertCell(0);
					newCell.colSpan = '2';
					newCell.innerHTML = "<span style='color:gray;'>Known missing quest: " +
					"</span><span style='color:blue;'>" + questName +
					"</span> <span style='color:gray;'>level:</span> <span style='color:blue;'>" + questLevel +
					"</span> <span style='color:gray;'>location:</span> <span style='color:blue;'>" + questLocation + "</span>";
				}
			}
		}
	},

	injectWorld: function() {
		Helper.mapThis();
		Helper.showMap(false);

		var injectHere = System.findNode("//tr[contains(td/img/@src, 'realm_right_bottom.jpg')]/../..");
		if (!injectHere) return;
		var newRow=injectHere.insertRow(1);
		var newCell=newRow.insertCell(0);
		newCell.setAttribute("background", System.imageServer + "/skin/realm_right_bg.jpg");

		var buttonRow = System.findNode("//tr[td/a/img[@title='Open Realm Map']]");

		if (GM_getValue("sendGoldonWorld")){
			var recipient_text = "Send " +GM_getValue("goldAmount") + " gold To " + GM_getValue("goldRecipient");
			buttonRow.innerHTML += '<td valign="top" width="5"></td>' +
				'<td valign="top"><img style="cursor:pointer" id="Helper:SendGold" src="' + System.imageServer +
				'/skin/gold_button.gif" title= "' + recipient_text + '" border="1" />';
		}

		if (!GM_getValue("hideKrulPortal")) {
			buttonRow.innerHTML += '<td valign="top" width="5"></td>' +
				'<td valign="top"><img style="cursor:pointer" id="Helper:PortalToStart" src="' + System.imageServer +
				'/temple/3.gif" title="Instant port to Krul Island" border="1" /></span></td>';
		}

		var footprints = GM_getValue("footprints");

		buttonRow.innerHTML += '<td valign="top" width="5"></td>' +
			'<td valign="top"><img style="cursor:pointer" id="Helper:ToggleFootprints" src="' + System.imageServer +
			'/skin/' + (footprints?'quest_complete':'quest_incomplete') + '.gif" title="Toggle Footprints" border="0"></td>';
		if (GM_getValue("sendGoldonWorld")){
			//document.getElementById('Helper:PortalToStart').addEventListener('click', Helper.portalToStartArea, true);
			document.getElementById('Helper:SendGold').addEventListener('click', Helper.sendGoldToPlayer, true);
		}
		if (!GM_getValue("hideKrulPortal")) {
			document.getElementById('Helper:PortalToStart').addEventListener('click', Helper.portalToStartArea, true);
		}

		// One may ask why the separation of creating the button and the event handling code.
		// Well, obviously (so obvious it took me 3 hours to figure out), when you change the HTML of
		// a region, all attached events are destroyed (because the original elements are also destroyed)

		document.getElementById('Helper:ToggleFootprints').addEventListener('click', Helper.toggleFootprints, true);

		Helper.checkBuffs();
		Helper.prepareCheckMonster();
		Helper.prepareCombatLog();

		//quest tracker
		var questBeingTracked = GM_getValue("questBeingTracked");
		if (questBeingTracked) {
			var injectHere = System.findNode("//tr[contains(td/img/@src, 'realm_right_bottom.jpg')]/../..");
			if (!injectHere) return;
			var replacementText = "<td background='" + System.imageServer + "/skin/realm_right_bg.jpg'>"
			replacementText += "<table width='280' cellpadding='1' style='margin-left:28px; margin-right:28px; " +
				"font-size:medium; border-spacing: 1px; border-collapse: collapse;'>"
			replacementText += "<tr><td colspan='2' height='10'></td></tr><tr><tr><td height='1' bgcolor='#393527' " +
				"colspan='2'></td></tr>";
			replacementText += "<tr><td style='font-size:small; color:black'><a href=" + questBeingTracked + ">Quest Info:</a>&nbsp;"
			replacementText += "<input id='dontTrackThisQuest' type='button' value='Stop Tracking Quest' title='Stops tracking quest progress.' class='custombutton'><br>";
			replacementText += "<span findme='questinfo'></span></td></tr>"
			replacementText += "</table>";
			replacementText += "</td>";

			newRow=injectHere.insertRow(2);
			newRow.innerHTML=replacementText;
			System.xmlhttp(questBeingTracked, Helper.getQuestInfo);
			document.getElementById("dontTrackThisQuest").addEventListener("click", Helper.dontTrackThisQuest, true);
		}
		
		var mapName = System.findNode('//td[contains(@background,"/skin/realm_top_b2.jpg")]/center/nobr');
		if (mapName) {
			mapName.innerHTML += ' <a href="http://www.fallenswordguide.com/realms/?search=' + mapName.textContent + '" target="_blank">' +
				'<img border=0 title="Search map in FSG" width=10 height=10 src="http://www.fallenswordguide.com/favicon.ico"/></a>' +
				' <a href="http://wiki.fallensword.com/index.php/Special:Search?search=' + mapName.textContent + '&go=Go" target="_blank">' +
				'<img border=0 title="Search map in Wiki" width=10 height=10 src="/favicon.ico"/></a>'

		}
		if (GM_getValue("quickKill")) {
			var doNotKillList = GM_getValue("doNotKillList");
			var doNotKillListAry = doNotKillList.split(",")
			for (var i=0; i<9; i++) {
				var monster = System.findNode("//a[@id='aLink" + i + "']")
				if (monster) {
					var monsterName = monster.parentNode.parentNode.previousSibling.textContent.trim();
					for (var j=0; j<doNotKillListAry.length; j++) {
						var doNotKillName = doNotKillListAry[j].trim();
						if (monsterName == doNotKillName){
							var monsterNameCell = monster.parentNode.parentNode.previousSibling
							monsterNameCell.innerHTML = '<span style="color:blue;">' + monsterNameCell.innerHTML + '</span>';
							break;
						}
					}
				}
			}
		}
	},

	injectWorldMap: function() {
		Helper.showMap(true);
	},

	retrieveTradeConfirm: function() {
		var xcNumber;
		xcNumber=System.findNode("//input[@type='hidden' and @name='xc']")
		xcNumber=xcNumber?xcNumber.getAttribute("value"):"-";
		GM_setValue("goldConfirm", xcNumber);
	},

	sendGoldToPlayer: function(){
		var recipient = GM_getValue("goldRecipient");
		var amount = GM_getValue("goldAmount");
		System.xmlhttp('index.php?cmd=trade');
		var xcNum = GM_getValue("goldConfirm");
		if (xcNum == "") {
			window.alert("You have to visit the trade page once to use the send gold functionality");
			return;
		}
		var url = 'index.php?cmd=trade&subcmd=sendgold&xc=' + xcNum + '&target_username=' + recipient +'&gold_amount='+ amount
		System.xmlhttp(url, Helper.goldToPlayerSent, {"amount": amount, "recipient": recipient} );
	},

	goldToPlayerSent: function(responseText, callback) {
		var injectHere = System.findNode("//tr[contains(td/img/@src, 'realm_right_bottom.jpg')]/../..");
		if (!injectHere) return;
		var newRow=injectHere.insertRow(1);
		var newCell=newRow.insertCell(0);
		newCell.setAttribute("background", System.imageServer + "/skin/realm_right_bg.jpg");
		var info = Layout.infoBox(responseText);
		if (info=="" || info=="You successfully sent gold!") {
			info = 'You successfully sent ' + callback.amount + ' gold to ' + callback.recipient + '!';
		}
		newCell.innerHTML='<div style="margin-left:28px; margin-right:28px; color:navy; font-size:xx-small;">' + info + '</div>';
	},

	toggleFootprints: function() {
		var footprints = GM_getValue("footprints");
		if (footprints == undefined) footprints=false;
		footprints = !footprints;
		GM_setValue("footprints", footprints);

		if (!footprints) { // clear footprints
			var theMap = System.getValueJSON("map");
			var realm = System.findNode("//td[contains(@background,'/skin/realm_top_b2.jpg')]/center/nobr/b");
			var levelName=realm.innerHTML;
			Helper.levelName = levelName;
			theMap["levels"][Helper.levelName]={};
			System.setValueJSON("map", theMap)
		}

		document.getElementById('Helper:ToggleFootprints').src =
			System.imageServer +
			'/skin/' + (footprints?'quest_complete':'quest_incomplete') + '.gif'
	},

	prepareCombatLog: function() {
		if (!GM_getValue("showCombatLog")) return;
		var reportsTable=System.findNode("//table[@width='320']/parent::*");
		if (!reportsTable) return;
		var tempLog=document.createElement("div");
		tempLog.id="reportsLog";
		var injLog=reportsTable.appendChild(tempLog);
		var is=injLog.style;
		is.color = 'black';
		is.backgroundImage='url(' + System.imageServer + '/skin/realm_right_bg.jpg)';
		is.maxHeight = '240px';
		is.width = '277px';
		is.maxWidth = is.width;
		is.marginLeft = '0px';
		is.marginRight = '0px';
		is.paddingLeft = '26px';
		is.paddingRight = '24px';
		is.overflow = 'hidden';
		is.fontSize = 'xx-small';
		is.textAlign = 'justify';
	},

	getMonster: function(index) {
		return System.findNode("//a[@id='aLink" + index + "']");
	},

	killSingleMonster: function(monsterNumber) {
		if (!GM_getValue("quickKill")) return;
		var kills=0;
		var monster = Helper.getMonster(monsterNumber);

		var doNotKillList = GM_getValue("doNotKillList");
		var doNotKillListAry = doNotKillList.split(",")

		if (monster) {
			var monsterName = monster.parentNode.parentNode.previousSibling.textContent.trim();
			var injectHere = monster.parentNode.parentNode;
			var monsterFound = false;
			for (var j=0; j<doNotKillListAry.length; j++) {
				var doNotKillName = doNotKillListAry[j].trim();
				if (monsterName == doNotKillName){
					injectHere.innerHTML = '<nobr><span style="color:blue; font-size:x-small;">On do not kill list&nbsp;</span></nobr>';
					monsterFound = true;
					break;
				}
			}
			if (!monsterFound) {
				kills+=1;
				System.xmlhttp(monster.href, Helper.killedMonster, {"node": monster, "index": monsterNumber});
			}
		}
	},

	prepareCheckMonster: function() {
		Helper.colorMonsters();
		Helper.getMonsterInfo();
	},

	colorMonsters: function() {
		if (!GM_getValue("enableCreatureColoring")) return;
		monsters = System.findNodes("//a[contains(@href,'cmd=combat') and not(contains(@href,'max_turns='))]");
		if (!monsters) return;
		for (var i=0; i<monsters.length; i++) {
			var monster = monsters[i];
			if (monster) {
				// add monster color based on elite types
				var monsterText = monster.parentNode.parentNode.parentNode.cells[1];
				if (monsterText.textContent.match(/\(Champion\)/i))
					monsterText.style.color = 'green';
				if (monsterText.textContent.match(/\(Elite\)/i))
					monsterText.style.color = 'yellow';
				if (monsterText.textContent.match(/\(Super Elite\)/i))
					monsterText.style.color = 'red';
			}
		}
	},

	getMonsterInfo: function() {
		if (!GM_getValue("showCreatureInfo")) return;
		var monsters = System.findNodes("//a[contains(@href,'cmd=world&subcmd=viewcreature&creature_id=')]");
		if (!monsters) return;
		for (var i=0; i<monsters.length; i++) {
			var monster = monsters[i];
			if (monster) {
				var href=monster.href;
				System.xmlhttp(monster.href, Helper.checkedMonster, monster);
			}
		}
	},

	checkedMonster: function(responseText, callback) {
		var creatureInfo=System.createDocument(responseText);
		var statsNode = System.findNode("//table[@width='400']", creatureInfo);
		if (!statsNode) {return;} // FF2 error fix
		var classNode = System.findNode("//table[@width='400']/tbody/tr/td[contains(.,'Class:')]/following-sibling::td", creatureInfo);
		var levelNode = System.findNode("//table[@width='400']/tbody/tr/td[contains(.,'Level:')]/following-sibling::td", creatureInfo);
		var attackNode = System.findNode("//table[@width='400']/tbody/tr/td[contains(.,'Attack:')]/following-sibling::td", creatureInfo);
		var defenseNode = System.findNode("//table[@width='400']/tbody/tr/td[contains(.,'Defense:')]/following-sibling::td", creatureInfo);
		var armorNode = System.findNode("//table[@width='400']/tbody/tr/td[contains(.,'Armor:')]/following-sibling::td", creatureInfo);
		var damageNode = System.findNode("//table[@width='400']/tbody/tr/td[contains(.,'Damage:')]/following-sibling::td", creatureInfo);
		var hitpointsNode = System.findNode("//table[@width='400']/tbody/tr/td[contains(.,'HP:')]/following-sibling::td", creatureInfo);
		var goldNode = System.findNode("//table[@width='400']/tbody/tr/td[contains(.,'Gold:')]/following-sibling::td", creatureInfo);
		var enhanceNodesXpath = "//table[@width='400']/tbody/tr[contains(td,'Enhancements')]/following-sibling::*[td/font[@color='#333333']]"
		var enhanceNodes = System.findNodes(enhanceNodesXpath, creatureInfo);

		var hitpoints = parseInt(hitpointsNode.textContent.replace(/,/g,""));
		var armorNumber = parseInt(armorNode.textContent.replace(/,/g,""));
		var oneHitNumber = Math.ceil((hitpoints*1.053)+(armorNumber*1.053));

		var recolor=System.findNodes("//td[@bgcolor='#cd9e4b']", statsNode);
		for (var i=0; i<recolor.length; i++) {
			recolor[i].style.color="black";
		}
		recolor=System.findNodes("//font[@color='#333333']", statsNode);
		for (var i=0; i<recolor.length; i++) {
			recolor[i].style.color="#cccccc";
		}
		var killButtons=System.findNode("tbody/tr[td/input]", statsNode);
		var killButtonHeader=System.findNode("tbody/tr[contains(td,'Actions')]", statsNode);
		var killButtonParent=killButtonHeader.parentNode;

		var imageNode = System.findNode("//img[contains(@src, '/creatures/')]", creatureInfo);
		var nameNode = System.findNode("//img[contains(@src, '/creatures/')]/../../following-sibling::tr[1]/td", creatureInfo);

		if (GM_getValue("showMonsterLog")) {
			Helper.pushMonsterInfo({"key0":nameNode.textContent, "key1":imageNode.src, "key2":classNode.textContent, "key3":levelNode.textContent,
				"key4":attackNode.textContent, "key5":defenseNode.textContent, "key6":armorNode.textContent, "key7":damageNode.textContent,
				"key8":hitpointsNode.textContent, "key9":goldNode.textContent});
		}

		levelNode.innerHTML += " (your level:<span style='color:yellow'>" + Helper.characterLevel + "</span>)"
		attackNode.innerHTML += " (your defense:<span style='color:yellow'>" + Helper.characterDefense + "</span>) "
		defenseNode.innerHTML += " (your attack:<span style='color:yellow'>" + Helper.characterAttack + "</span>)"
		armorNode.innerHTML += " (your damage:<span style='color:yellow'>" + Helper.characterDamage + "</span>)"
		damageNode.innerHTML += " (your armor:<span style='color:yellow'>" + Helper.characterArmor + "</span>)"
		hitpointsNode.innerHTML += " (your HP:<span style='color:yellow'>" + Helper.characterHP + "</span>)" +
			"(1H: <span style='color:red'>" + oneHitNumber + "</span>)"

		killButtonParent.removeChild(killButtons);
		killButtonParent.removeChild(killButtonHeader);
		callback.setAttribute("mouseOverText", "<table>" +
			"<tr><td valign=top>" + imageNode.parentNode.innerHTML + "</td>" +
			"<td rowspan=2>" + statsNode.parentNode.innerHTML + "</td></tr>" +
			"<tr><td align=center valign=top>" + nameNode.innerHTML + "</td></tr></table>");
		callback.setAttribute("mouseOverWidth", "600");
		callback.addEventListener("mouseover", Helper.clientTip, true);
	},

	pushMonsterInfo: function(monster) {
		// name, img, cls, lvl, atk, def, arm, dmg, hp, gold
		var name = monster.key0;
		var monsterLog = System.getValueJSON("monsterLog");
		if (!monsterLog) monsterLog = {};
		if (!monsterLog[name]) {
			monsterLog[name] = {"min":{}, "max":{}};
			for (i = 1; i < 10; i++) {
				monsterLog[name]["min"]["key" + i] = 1e+100;
				monsterLog[name]["max"]["key" + i] = 0;
			}
			//monsterLog[name]["min"] = {"cls":1e+100, "lvl":1e+100, "atk":1e+100, "def":1e+100, "arm":1e+100, "dmg":1e+100, "hp":1e+100, "gold":1e+100};
			//monsterLog[name]["max"] = {"cls":0, "lvl":0, "atk":0, "def":0, "arm":0, "dmg":0, "hp":0, "gold":0};
		}
		for (i = 1; i < 4; i++)
			monsterLog[name]["min"]["key" + i] = monster["key" + i];
		for (i = 4; i < 10; i++) {
			var value = System.intValue(monster["key" + i]);
			monsterLog[name]["min"]["key" + i] = monsterLog[name]["min"]["key" + i] < value
				? monsterLog[name]["min"]["key" + i] : value;
			monsterLog[name]["max"]["key" + i] = monsterLog[name]["max"]["key" + i] > value
				? monsterLog[name]["max"]["key" + i] : value;
		}
		System.setValueJSON("monsterLog", monsterLog);
	},

	injectMonsterLog: function() {
		var entityLog = System.getValueJSON("monsterLog");
		if (entityLog) {
			Helper.entityLogTable = {entity:[]};
			for (var name in entityLog) {
				var newEntity = {};
				newEntity["name"] = name;
				newEntity["key1"] = entityLog[name]["min"]["key1"];
				for (i = 2; i < 4; i++)
					newEntity["key" + i] = entityLog[name]["min"]["key" + i];
				for (i = 4; i < 10; i++)
					newEntity["key" + i] = System.addCommas(entityLog[name]["min"]["key"+i]) + ' - ' +
						System.addCommas(entityLog[name]["max"]["key"+i]);
				Helper.entityLogTable.entity.push(newEntity);
			}
			Helper.sortBy = 'key3';
			Helper.sortAsc = true;
			Helper.entityLogTable.entity.sort(Helper.numberSort);
		}
		var content=Layout.notebookContent();
		content.innerHTML = '<span id=Helper.entityTableOutput>No monster information! Please enable entity log and travel a bit to see the world</span>';
		Helper.generateEntityTable();
	},

	generateEntityTable: function() {
		var content = document.getElementById("Helper.entityTableOutput");
		if (!Helper.entityLogTable || !content) return;
		var result = '<table cellspacing="0" cellpadding="0" border="0" width="100%"><tr style="background-color:#110011">'+
			'<td width="90%" nobr align=center><b>&nbsp;Entity Information</b></td>'+
			'<td width="10%" nobr>[<span id="Helper.clearEntityLog">Clear</span>]</td>'+
			'</tr>' +
			'</table>'+
			'<table id="Helper:EntityInfo" cellspacing="1" cellpadding="2" border="0" ><tr>' +
			'<th width="25%" align="left" sortkey="name" colspan="2">Entity</th>' +
			'<th align="center" sortkey="key2">Class</th>' +
			'<th align="center" sortkey="key3" sorttype="number">Lvl</th>' +
			'<th align="center">Attack</th>' +
			'<th align="center">Defence</th>' +
			'<th align="center">Armor</th>' +
			'<th align="center">Damage</th>' +
			'<th align="center">HP</th>' +
			'<th align="center">Credits</th>' +
			'</tr>';
		for (var k=0;k<Helper.entityLogTable.entity.length;k++) {
			result += '<tr><td align="center"><img width=40 height=40 ' +
					'onmouseover="tt_setWidth(200);Tip(\'<img src=' + Helper.entityLogTable.entity[k]["key1"] + '/>\');" ' +
					'src="' + Helper.entityLogTable.entity[k]["key1"] + '"/></td>';
			result += '<td align="left">' + Helper.entityLogTable.entity[k]["name"] + '</td>';
			for (i = 2; i < 4; i++)
				result += '<td align="center">' + System.addCommas(Helper.entityLogTable.entity[k]["key"+i]) + '</td>';
			for (i = 4; i < 10; i++)
				result += '<td align="center">' + Helper.entityLogTable.entity[k]["key"+i] + '</td>';
		}
		result += "</table>";
		content.innerHTML = result;
		document.getElementById("Helper.clearEntityLog").addEventListener("click", Helper.clearEntityLog, true);

		var theTable=document.getElementById('Helper:EntityInfo');
		for (var i=0; i<theTable.rows[0].cells.length; i++) {
			var cell=theTable.rows[0].cells[i];
			if (cell.getAttribute("sortkey")) {
				cell.style.textDecoration="underline";
				cell.style.cursor="pointer";
				cell.addEventListener('click', Helper.sortEntityLogTable, true);
			}
		}
	},

	clearEntityLog: function() {
		GM_setValue("monsterLog", "");
		window.location="index.php?cmd=notepad&subcmd=monsterlog";
	},

	sortEntityLogTable: function(evt) {
		var headerClicked = evt.target.getAttribute("sortKey");
		var sortType = evt.target.getAttribute("sortType");
		if (!sortType) sortType="string";
		if (Helper.sortAsc==undefined) Helper.sortAsc=true;
		if (Helper.sortBy && Helper.sortBy==headerClicked) {
			Helper.sortAsc=!Helper.sortAsc;
		}

		Helper.sortBy=headerClicked;
		GM_log(Helper.sortAsc + " " + Helper.sortBy + " " + sortType);

		switch(sortType) {
			case "string":
				Helper.entityLogTable.entity.sort(Helper.stringSort);
				break;
			case "number":
				Helper.entityLogTable.entity.sort(Helper.numberSort);
				break;
		}
		Helper.generateEntityTable();
	},

	killedMonster: function(responseText, callback) {
		var doc=System.createDocument(responseText);

		var reportRE=/var\s+report=new\s+Array;\n(report\[[0-9]+\]="[^"]+";\n)*/;
		var report=responseText.match(reportRE);
		if (report) report=report[0]

		// var specialsRE=/<div id="specialsDiv" style="position:relative; display:block;"><font color='#FF0000'><b>Azlorie Witch Doctor was withered.</b></font>/
		var specials=System.findNodes("//div[@id='specialsDiv']", doc);

		var playerId = Layout.playerId();

		var xpGain       = System.getIntFromRegExp(responseText, /var\s+xpGain=(-?[0-9]+);/i);
		var goldGain     = System.getIntFromRegExp(responseText, /var\s+goldGain=(-?[0-9]+);/i);
		var guildTaxGain = System.getIntFromRegExp(responseText, /var\s+guildTaxGain=(-?[0-9]+);/i);
		var levelUp      = System.getIntFromRegExp(responseText, /var\s+levelUp=(-?[0-9]+);/i);
		var lootRE=/You looted the item '<font color='(\#[0-9A-F]+)'>([^<]+)<\/font>'<\/b><br><br><img src=\"http:\/\/[0-9.]+\/items\/(\d+).gif\"\s+onmouseover="ajaxLoadCustom\([0-9]+,\s-1,\s+([0-9a-f]+),\s+[0-9]+,\s+''\);\">/
		var info         = Layout.infoBox(responseText);
		var lootMatch=responseText.match(lootRE)
		var lootedItem = "";
		var lootedItemId = "";
		var lootedItemVerify="";
		if (lootMatch && lootMatch.length>0) {
			lootedItem=lootMatch[2];
			lootedItemId=lootMatch[3];
			lootedItemVerify=lootMatch[4];
		}
		var shieldImpDeathRE = /Shield Imp absorbed all damage/;
		var shieldImpDeath = responseText.match(shieldImpDeathRE);

		var monster = callback.node;
		if (monster) {
			var result=document.createElement("div");
			var resultHtml = "<small><small>"+callback.index+". XP:" + xpGain + " Gold:" + goldGain + " (" + guildTaxGain + ")</small></small>";
			var resultText = "XP:" + xpGain + " Gold:" + goldGain + " (" + guildTaxGain + ")\n"
			if (info!="") {
				resultHtml += "<br/><div style='font-size:x-small;width:120px;overflow:hidden;' title='" + info + "'>" + info + "</div>";
				resultText += info + "\n";
			}
			if (lootedItem!="") {
				// I've temporarily disabled the ajax thingie, as it doesn't seem to work anyway.
				resultHtml += "<br/><small><small>Looted item:<span onclickDISABLED=\"ajaxLoadItem(" +
					lootedItemId + ", -1, 2, " + playerId + ", '');\" >" +
					lootedItem + "</span></small></small>";
				resultText += "Looted item:" + lootedItem + "\n";
			}
			if (shieldImpDeath) {
				resultHtml += "<br/><small><small><span style='color:red;'>Shield Imp Death</span></small></small>";
				resultText += "Shield Imp Death\n"
			}
			if (xpGain<0) result.style.color='red';
			result.innerHTML=resultHtml
			var monsterParent = monster.parentNode;
			result.id = "result" + callback.index;
			if (report) {
				var reportLines=report.split("\n");
				var reportHtml="";
				var reportText="";
				if (specials) {
					reportHtml += "<div style='color:red'>"
					for (var i=0; i<specials.length; i++) {
						reportHtml += specials[i].textContent + "<br/>";
						reportText += specials[i].textContent + "\n";
					}
					reportHtml += "</div>";
				}
				for (var i=0; i<reportLines.length; i++) {
					var reportMatch = reportLines[i].match(/\"(.*)\"/);
					if (reportMatch) {
						reportHtml += "<br/>" + reportMatch[1];
						reportText += reportMatch[1].replace(/<br>/g, "\n") + "\n";
					}
				}
				if (levelUp=="1") {
					reportHtml += '<br/><br/><div style="color:#999900;font-weight:bold;>Your level has increased!</div>';
					reportText += "Your level has increased!\n";
				}
				if (levelUp=="-1") {
					reportHtml += '<br/><br/><div style="color:#991100;font-weight:bold;">Your level has decreased!</div>';
					reportText += "Your level has decreased!\n";
				}
				mouseOverText = "<div><div style='color:#FFF380;text-align:center;'>Combat Results</div>" + reportHtml + "</div>";
				Helper.appendCombatLog(reportHtml);
				result.setAttribute("mouseOverText", mouseOverText);
				if (GM_getValue("keepLogs")) {
					var now=new Date();
					Helper.appendSavedLog("\n================================\n" + now.toLocaleFormat("%Y-%M-%d %H:%m:%S") + "\n" + resultText + "\n" + reportText);
				}
			}
			monsterParent.innerHTML = "";
			monsterParent.insertBefore(result, monsterParent.nextSibling);
			if (report) {
				document.getElementById("result" + callback.index).addEventListener("mouseover", Helper.clientTip, true);
			}
		}
	},

	appendSavedLog: function(text) {
		var theLog=GM_getValue("CombatLog");
		if (!theLog) theLog="";
		theLog+=text;
		GM_setValue("CombatLog", theLog);
	},

	appendCombatLog: function(text) {
		var reportLog = System.findNode("//div[@id='reportsLog']");
		if (!reportLog) return;
		reportLog.innerHTML += text + "<br/>";
	},

	scrollUpCombatLog: function() {
		var reportLog = System.findNode("//div[@id='reportsLog']");
		reportLog.scrollTop-=10;
	},

	scrollDownCombatLog: function() {
		var reportLog = System.findNode("//div[@id='reportsLog']");
		reportLog.scrollTop+=10;
	},

	clientTip: function(evt) {
		var target=evt.target;
		var value, width;
		do {
			if (target.getAttribute) {
				value=target.getAttribute("mouseovertext");
				width=target.getAttribute("mouseoverwidth");
			}
			target=target.parentNode;
		} while (!value && target);
		if (value) {
			if (!width) width="250";
			unsafeWindow.tt_setWidth(parseInt(width));
			unsafeWindow.Tip(value);
		}
	},

	prepareGuildList: function() {
		if (!GM_getValue("enableGuildOnlineList")) {
			GM_setValue("guildOnlineRefreshTime", 300);
			Helper.retrieveGuildData(true); //Refresh guild data every 5 mins but don't inject online guild list
		} 
		else {
			var injectHere = System.findNode("//table[@width='120' and contains(.,'New?')]")
			if (!injectHere) return;
			var info = injectHere.insertRow(0);
			var cell = info.insertCell(0);
			cell.innerHTML="<span id='Helper:GuildListPlaceholder'></span>";
			Helper.retrieveGuildData(false);
		}
	},

	retrieveGuildData: function(refreshGuildDataOnly) {
		var memberList = System.getValueJSON("memberlist");
		var guildOnlineRefreshTime = GM_getValue("guildOnlineRefreshTime");
		guildOnlineRefreshTime *= 1000;
		if (memberList) {
			if ((new Date()).getTime() - memberList.lastUpdate.getTime() > guildOnlineRefreshTime) memberList = null; // invalidate cache
		}

		if (!memberList || refreshGuildDataOnly) {
			System.xmlhttp("index.php?cmd=guild&subcmd=manage", Helper.parseGuildForWorld, refreshGuildDataOnly);
		} else {
			var memberList = System.getValueJSON("memberlist");
			memberList.isRefreshed = false;
			Helper.injectGuildList(memberList);
		}
	},

	parseGuildForWorld: function(details, refreshGuildDataOnly) {
		var doc=System.createDocument(details);
		var allTables = doc.getElementsByTagName("TABLE")
		var membersTable;
		for (var i=0;i<allTables.length;i++) {
			var oneTable=allTables[i];
			if (oneTable.rows.length>=1 && oneTable.rows[0].cells.length>=1 && (/<b>Members<\/b>/i).test(oneTable.rows[0].cells[0].innerHTML)) {
				membersTable=oneTable;
			}
		}

		if (membersTable) {
			var membersDetails=membersTable.getElementsByTagName("TABLE")[0];
			var memberList = System.getValueJSON("memberlist");
			if (!memberList) {
				memberList = {};
				memberList.members = [];
			}

			memberList.members.forEach(function(e) {e.status="Deleted"});

			for (var i=0;i<membersDetails.rows.length;i++) {
				var aRow = membersDetails.rows[i];
				if (aRow.cells.length==5 && aRow.cells[0].firstChild.title) {
					var playerLink   = aRow.cells[1].firstChild.nextSibling;
					var memberId     = System.intValue((/[0-9]+$/).exec(playerLink.href)[0]);
					var memberName   = playerLink.textContent;
					var memberLevel  = System.intValue(aRow.cells[2].textContent);
					var memberRank   = aRow.cells[3].textContent;
					var memberXP     = System.intValue(aRow.cells[4].textContent);
					var memberStatus = aRow.cells[0].firstChild.title;

					var aMember;

					// find member in member list, to modify data instead of replacing it

					var findMembers = memberList.members.filter(function (e) {return e.id==memberId});
					if (findMembers.length>0) {
						aMember = findMembers[0];
					}
					else { // member was not found, must be a new player
						aMember = {};
						// You can still modify an object, even if you have added it to something else
						memberList.members.push(aMember);
						aMember.firstSeen = new Date();
						aMember.status = "Offline"; // new players are supposed to be offline
					}
					Helper.getFullPlayerData(aMember);

					if (aMember.status == "Offline" && memberStatus=="Online") {
						aMember.loggedInAt = new Date();
					}

					if (!aMember.loggedInAt) {
						aMember.loggedInAt = new Date();
					}

					aMember.status = memberStatus;
					aMember.id     = memberId;
					aMember.name   = memberName;
					aMember.level  = memberLevel;
					aMember.rank   = memberRank;
					aMember.xp     = memberXP;
				}
			}

			// remove not existing players
			memberList.members = memberList.members.filter(function(e) {return e.status!="Deleted"});
			// damn, I love javascript array functions :)

			memberList.lastUpdate = new Date();
			memberList.isRefreshed = true;
			System.setValueJSON("memberlist", memberList);
			if (!refreshGuildDataOnly) Helper.injectGuildList(memberList);
		}
	},

	prepareChat: function() {
		var showLines = parseInt(GM_getValue("chatLines"))
		if (showLines==0) return;
		var injectHere = System.findNode("//table[@width='120' and contains(.,'New?')]")
		if (!injectHere) return;
		var info = injectHere.insertRow(GM_getValue("enableGuildOnlineList")?1:0)
		var cell = info.insertCell(0);
		cell.innerHTML="<span id='Helper:ChatPlaceholder'></span>";
		var chat = System.getValueJSON("chat");
		var newChat = System.findNode("//table[contains(.,'chat messages')]")
		if (!chat || newChat || ((new Date()) - chat.lastUpdate > 15000)) {
			Helper.retrieveChat();
		} else {
			chat.isRefreshed=false;
			Helper.injectChat(chat);
		}
	},

	retrieveChat: function() {
		System.xmlhttp("index.php?cmd=guild&subcmd=chat", Helper.parseChatForWorld);
	},

	parseChatForWorld: function(chatText) {
		var doc=System.createDocument(chatText);
		var chatTable = System.findNode("//table[@border='0' and @cellpadding='2' and @width='100%']", doc);
		if (!chatTable) return;
		// GM_log(chatTable.innerHTML);
		var chat = new Object();
		var chatConfirm=System.findNode("//input[@name='xc']", doc);
		chat.isRefreshed=true;
		chat.lastUpdate = new Date();
		chat.messages = [];
		for (var i=chatTable.rows.length-1; i>0; i--) {
			var aRow = chatTable.rows[i];
			if (aRow.cells.length==3) {
				var aMessage=new Object();
				aMessage.time=aRow.cells[0].textContent;
				aMessage.from=aRow.cells[1].textContent;
				aMessage.text=aRow.cells[2].textContent;
				chat.messages.push(aMessage);
			}
		}
		chat.confirm=chatConfirm.value;
		Helper.injectChat(chat);
	},

	injectChat: function(chat){
		var injectHere = document.getElementById("Helper:ChatPlaceholder");
		var newTable=false;
		var topToBottom = GM_getValue("chatTopToBottom");

		var displayList = document.getElementById("Helper:ChatWindow");
		if (!displayList) {
			displayList=document.createElement("TABLE");
			displayList.id="Helper:ChatWindow";
			displayList.style.border = "1px solid #c5ad73";
			displayList.style.backgroundColor = (chat.isRefreshed)?"#6a5938":"#4a3918";
			displayList.cellPadding = 1;
			displayList.width = 125;
			newTable=true;
		}
		else {
			while (displayList.rows.length>0) {
				displayList.deleteRow(0);
			}
			displayList.style.backgroundColor = (chat.isRefreshed)?"#6a5938":"#4a3918";
		}

		var aRow=displayList.insertRow(displayList.rows.length);
		var aCell=aRow.insertCell(0);

		var result="<div style='font-size:xx-small' id='chatFrame'>";

		var showLines = parseInt(GM_getValue("chatLines"));
		if (isNaN(showLines)) {
			showLines=10
			GM_setValue("chatLines", showLines)
		}
		var startFrom = (chat.messages.length>showLines)?chat.messages.length-showLines:0;
		for (var i=startFrom; i<chat.messages.length; i++) {
			var j = topToBottom?i:chat.messages.length-i+startFrom-1; // chat.messages.length-i;
			result += "<span style='color:#F5F298' title='"+chat.messages[j].time+"'>";
			result += chat.messages[j].from
			result += ":</span><span style='color:white'>"
			result += chat.messages[j].text.replace(/</g,"&lt;").replace(/>/g,"&gt;");
			result += "</span><br/>";
		}
		result += '<form action="index.php" method="post" id="Helper:ChatBox" onsubmit="return false;">';
		result += '<input type="hidden" value="' + chat.confirm + '" name="Helper:ChatConfirm"/>';
		result += '<input type="text" class="custominput" size="14" name="Helper:ChatMessage"/>';
		result += '<input type="submit" name="submit" class="custombutton" value="Send" name="submit"/>';
		result += '&nbsp;&nbsp;&nbsp;&nbsp;';
		result += '<input type="button" name="submitmass" id="Helper:ChatBoxMass" class="custombutton" value="Mass" name="submit"/>';
		result += '</form>';
		result += '</div>';

		aCell.innerHTML = result;

		if (newTable) {
			var breaker=document.createElement("BR");
			injectHere.parentNode.insertBefore(breaker, injectHere.nextSibling);
			injectHere.parentNode.insertBefore(displayList, injectHere.nextSibling);
		}

		document.getElementById('Helper:ChatBox').addEventListener('submit', Helper.sendChat, true);
		document.getElementById('Helper:ChatBoxMass').addEventListener('click', Helper.sendMassChat, true);

		//document.removeEventListener("keypress", unsafeWindow.document.onkeypress, true);

		System.setValueJSON("chat", chat);
	},

	sendMassChat: function(evt) {
		if (!window.confirm("Are you sure you want to send a mass message?")) return;

		var oForm=evt.target.form;
		Helper.sendChatGeneric(oForm, true);
		return false;
	},

	sendChat: function(evt) {
		var oForm=evt.target;
		Helper.sendChatGeneric(oForm, false);
		return false;
	},

	sendChatGeneric: function(oForm, isMass) {
		var confirm=System.findNode("//input[@name='Helper:ChatConfirm']", oForm).value;
		var msg=System.findNode("//input[@name='Helper:ChatMessage']", oForm).value;
		System.findNode("//input[@name='Helper:ChatMessage']", oForm).value="";

		if (msg=="") {
			Helper.retrieveChat();
			return false;
		}

		sendType = isMass?"Send As Mass":"Send";

		GM_xmlhttpRequest({
			method: 'POST',
			url: System.server + "index.php",
			headers: {
				"User-Agent" : navigator.userAgent,
				"Content-Type": "application/x-www-form-urlencoded",
				"Referer": document.location,
				"Cookie" : document.cookie
			},
			data: "cmd=guild&subcmd=dochat&xc="+confirm+"&msg="+encodeURIComponent(msg)+"&submit="+sendType,
			onload: function() {
				Helper.retrieveChat();
			}
		})
	},

	replaceKeyHandler: function() {
		unsafeWindow.document.onkeypress = null;
		unsafeWindow.document.onkeypress = Helper.keyPress;
	},

	moveMe: function(dx, dy) {
		var pos=Helper.position();
		if (pos) {
			if (pos.type=="normal") {
				window.location = 'index.php?cmd=world&subcmd=move&x=' + (pos.X+dx) + '&y=' + (pos.Y+dy);
			}
			if (pos.type=="worldmap") {
				System.xmlhttp('index.php?cmd=world&subcmd=move&x=' + (pos.X+dx) + '&y=' + (pos.Y+dy), function() {window.location = System.server + "index.php?cmd=world&subcmd=map";});
			}
		}
	},

	killMonsterAt: function(index) {
		var linkObj	= Helper.getMonster(index);
		if (linkObj!=null) {
			if (GM_getValue("quickKill")) {
				Helper.killSingleMonster(index);
			}
			else {
				window.location = linkObj.href
			}
		}
	},

	keyPress: function (evt) {
		var r, s;
		if (evt.target.tagName!="HTML") return;

		// ignore control, alt and meta keys (I think meta is the command key in Macintoshes)
		if (evt.ctrlKey) return;
		if (evt.metaKey) return;
		if (evt.altKey) return;

		r = evt.charCode;
		s = evt.keyCode;

		switch (r) {
		case 113: // nw
			Helper.moveMe(-1,-1);
			break;
		case 119: // n
			Helper.moveMe(0,-1);
			break;
		case 101: // ne
			Helper.moveMe(1,-1);
			break;
		case 97: // w
			Helper.moveMe(-1,0);
			break;
		case 100: // e
			Helper.moveMe(1,0);
			break;
		case 122: // sw
			Helper.moveMe(-1,1);
			break;
		case 120: // s
			Helper.moveMe(0,1);
			break;
		case 99: // se
			Helper.moveMe(1,1);
			break;
		case 114: // repair
			window.location = 'index.php?cmd=blacksmith&subcmd=repairall&fromworld=1';
			break;
		case 71: // create group [G]
			window.location = 'index.php?cmd=guild&subcmd=groups&subcmd2=create&fromworld=1';
			break;
		case 103: // go to guild [g]
			window.location = 'index.php?cmd=guild&subcmd=manage'
			break;
		case 106: // join all group [j]
			window.location = 'index.php?cmd=guild&subcmd=groups&subcmd2=joinall';
			break;
		case 49:
		case 50:
		case 51:
		case 52:
		case 53:
		case 54:
		case 55:
		case 56: // keyed combat
			Helper.killMonsterAt(r-48);
			break;
		case 98: // backpack [b]
			window.location = 'index.php?cmd=profile&subcmd=dropitems&fromworld=1';
			break;
		case 19: // quick buffs
			// openWindow("", "fsQuickBuff", 618, 800, ",scrollbars");
			GM_openInTab(System.server + "index.php?cmd=quickbuff");
			break;
		case 48: // return to world
			window.location = 'index.php?cmd=world';
			break;
		case 109: // map
			// window.open('index.php?cmd=world&subcmd=map', 'fsMap');
			// openWindow('index.php?cmd=world&subcmd=map', 'fsMap', 650, 650, ',scrollbars,resizable');
			GM_openInTab(System.server + "index.php?cmd=world&subcmd=map");
			break;
		case 112: // profile
			window.location = 'index.php?cmd=profile';
			break;
		case 110: // mini map [n]
			Helper.displayMiniMap();
			break;
		case 62: // move to next page [>]
		case 60: // move to prev page [<]
			Helper.movePage({62:'>', 60:'<'}[r]);
			break;
		case 33: // Shift+1
		case 64: // Shift+2
		case 34: // Shift+2 -- for UK keyboards, I think
		case 35: // Shift+3
		case 36: // Shift+4
		case 37: // Shift+5
		case 94: // Shift+6
		case 38: // Shift+7
		case 42: // Shift+8
		case 40: // Shift+9
			var keyMap = {"key33":1, "key64":2, "key34":2, "key35":3, "key36":4, "key37":5,
				"key94":6, "key38":7, "key42":8, "key40":9};
			// I'm using "key??" because I don't feel comfortable of naming properties with integers
			var itemIndex = keyMap["key" + r];
			System.xmlhttp("index.php?cmd=profile", Helper.changeCombatSet, itemIndex);
			break;
		case 41: // Shift+0
			// TODO: ask for a number, check isnumeric, then call changeCombatSet with that index.
			break;
		case 0: // special key
			switch (s) {
			case 37: // w
				Helper.moveMe(-1,0);
				evt.preventDefault();
				evt.stopPropagation();
				break;
			case 38: // n
				Helper.moveMe(0,-1);
				evt.preventDefault();
				evt.stopPropagation();
				break;
			case 39: // e
				Helper.moveMe(1,0);
				evt.preventDefault();
				evt.stopPropagation();
				break;
			case 40: // s
				Helper.moveMe(0,1);
				evt.preventDefault();
				evt.stopPropagation();
				break;
			case 33:
				if (System.findNode("//div[@id='reportsLog']")) {
					Helper.scrollUpCombatLog();
					evt.preventDefault();
					evt.stopPropagation();
				}
				break;
			case 34:
				if (System.findNode("//div[@id='reportsLog']")) {
					Helper.scrollDownCombatLog();
					evt.preventDefault();
					evt.stopPropagation();
				}
				break;
			default:
				// GM_log('special key: ' +s);
				break;
			}
			break;
		default:
			// GM_log('standard key: ' +r);
			break;
		}
		return true;
	},

	addLogColoring: function(logScreen, dateColumn) {
		if (!GM_getValue("enableLogColoring")) return;
		var lastCheckScreen = "last" + logScreen + "Check";
		var localLastCheckMilli=GM_getValue(lastCheckScreen);
		if (!localLastCheckMilli) localLastCheckMilli=(new Date()).getTime();

		var chatTable = System.findNode("//table[@border='0' and @cellpadding='2' and @width='100%']");
		if (!chatTable) return;

		var localDateMilli = (new Date()).getTime();
		var gmtOffsetMinutes = (new Date()).getTimezoneOffset();
		var gmtOffsetMilli = gmtOffsetMinutes*60*1000;

		var newRow = chatTable.insertRow(1);
		var newCell = newRow.insertCell(0);

		for (var i=1;i<chatTable.rows.length;i++) {
			var aRow = chatTable.rows[i];
			//GM_log(aRow.innerHTML);
			var addBuffTag = true;
			if (aRow.cells[0].innerHTML) {
				//GM_log(aRow.cells[dateColumn].innerHTML);
				var cellContents = aRow.cells[dateColumn].innerHTML;
				cellContents = cellContents.substring(0,17); // fix for player log screen.
				postDateAsDate = System.parseDate(cellContents);
				postDateAsLocalMilli = postDateAsDate.getTime() - gmtOffsetMilli;
				postAge = (localDateMilli - postDateAsLocalMilli)/(1000*60);
				if (postDateAsLocalMilli > localLastCheckMilli) {
					aRow.style.backgroundColor = "#F5F298";
				}
				else if (postAge > 20 && postDateAsLocalMilli <= localLastCheckMilli) {
					aRow.style.backgroundColor = "#CD9E4B";
					addBuffTag = false;
				}
				if (logScreen == 'Chat' && addBuffTag) {
					var playerIDRE = /player_id=(\d+)/;
					var playerID = playerIDRE.exec(aRow.cells[1].innerHTML)[1];
					aRow.cells[1].innerHTML += " <a style='color:blue;font-size:10px;' " +
						Layout.quickBuffHref(playerID) + ">[b]</a>";
			}
		}
		}
		now=(new Date()).getTime()
		GM_setValue(lastCheckScreen, now.toString());
	},

	addLogWidgets: function() {
		var logTable = System.findNode("//table[@border='0' and @cellpadding='2' and @width='100%']");
		var memberList = System.getValueJSON("memberlist");
		var memberNameString = "";
		if (memberList) {
			for (var i=0;i<memberList.members.length;i++) {
				var member=memberList.members[i];
				memberNameString += member.name + " ";
			}
		}
		var listOfEnemies = GM_getValue("listOfEnemies");
		if (!listOfEnemies) listOfEnemies = "";
		var listOfAllies = GM_getValue("listOfAllies");
		if (!listOfAllies) listOfAllies = "";
		for (var i=0;i<logTable.rows.length;i++) {
			var aRow = logTable.rows[i];
			if (i != 0) {
				if (aRow.cells[0].innerHTML) {
					firstCell = aRow.cells[0];
					//Valid Types: General, Chat, Guild
					messageType = firstCell.firstChild.getAttribute("title");
					var colorPlayerName = false;
					var isGuildMate = false;
					if (messageType == "Chat") {
						var playerElement = aRow.cells[2].firstChild;
						var playerName = playerElement.innerHTML;
						colorPlayerName = true;
					}
					if (messageType == "General") {
						if (aRow.cells[2].firstChild.nextSibling && aRow.cells[2].firstChild.nextSibling.getAttribute("href")) {
							if (aRow.cells[2].firstChild.nextSibling.getAttribute("href").search("player_id") != -1) {
								playerElement = aRow.cells[2].firstChild.nextSibling;
								playerName = playerElement.innerHTML
								colorPlayerName = true;
							}
						}
					}
					
					if (colorPlayerName) {
						if (memberNameString.search(playerName) !=-1) {
							playerElement.style.color="green";
							isGuildMate = true;
						}
						if (listOfEnemies.search(playerName) !=-1) {
							playerElement.style.color="red";
						}
						if (listOfAllies.search(playerName) !=-1) {
							playerElement.style.color="blue";
						}
					}
					if (messageType == "Chat") {
						var messageHTML = aRow.cells[2].innerHTML;
						var firstPart = messageHTML.substring(0, messageHTML.indexOf("<small>") + 7);
						var secondPart = messageHTML.substring(messageHTML.indexOf("<small>") + 7, messageHTML.indexOf(">Reply</a>") + 10);
						var thirdPart = messageHTML.substring(messageHTML.indexOf(">Reply</a>") + 10, messageHTML.indexOf(">Buff</a>") + 9);
						var fourthPart = messageHTML.substring(messageHTML.indexOf(">Trade</a>") + 10, messageHTML.indexOf("</small>"));
						var lastPart = messageHTML.substring(messageHTML.indexOf("</small>"), messageHTML.length);
						var extraPart = " | <a href='index.php?cmd=trade&target_player=" + playerName + "'>Trade</a> | " +
							"<a title='Secure Trade' href='index.php?cmd=trade&subcmd=createsecure&target_username=" + playerName +
							"'>ST</a>"
						if (!isGuildMate) {
							extraPart += " | <a title='Add to Ignore List' href='index.php?cmd=log&subcmd=doaddignore&ignore_username=" + playerName +
							"'>Ignore</a>";
						}
						aRow.cells[2].innerHTML = firstPart + "<nobr>" + secondPart + extraPart + thirdPart  + fourthPart + "</nobr>" + lastPart;
					}
					if (aRow.cells[2].innerHTML.search("You have just been outbid at the auction house") != -1) {
						aRow.cells[2].innerHTML += ". Go to <a href='/index.php?cmd=auctionhouse&type=-50'>My Bids</a>.";
					}
					if (messageType == "General") {
						if (aRow.cells[2].firstChild.nextSibling && aRow.cells[2].firstChild.nextSibling.getAttribute("href")) {
							if (aRow.cells[2].firstChild.nextSibling.getAttribute("href").search("player_id") != -1) {
								var buffingPlayerIDRE = /player_id=(\d+)/;
								var buffingPlayerID = buffingPlayerIDRE.exec(aRow.cells[2].innerHTML)[1];
								var buffingPlayerName = aRow.cells[2].firstChild.nextSibling.innerHTML;
								var extraText = " <span style='font-size:x-small;'><nobr>[ <a href='index.php?cmd=message&target_player=" + buffingPlayerName +
									"'>Reply</a> | <a href='index.php?cmd=trade&target_player=" + buffingPlayerName +
									"'>Trade</a> | <a title='Secure Trade' href='index.php?cmd=trade&subcmd=createsecure&target_username=" + buffingPlayerName +
									"'>ST</a>";
								if (!isGuildMate) {
									extraText += " | <a title='Add to Ignore List' href='index.php?cmd=log&subcmd=doaddignore&ignore_username=" + playerName +
									"'>Ignore</a>";
								}
								extraText += " | <a " + Layout.quickBuffHref(buffingPlayerID) + ">Buff</a> ]</nobr></span>";
								aRow.cells[2].innerHTML += extraText;
							}
						}
					}
				}
			}
			else {
				var messageNameCell = aRow.firstChild.nextSibling.nextSibling.nextSibling;
				messageNameCell.innerHTML += "&nbsp;&nbsp;<span style='color:white;'>(Guild mates show up in <span style='color:green;'>green</span>)</span>"
			}
		}
	},

	addGuildLogWidgets: function() {
		if (!GM_getValue("hideNonPlayerGuildLogMessages")) return;
		var playerId=Layout.playerId();
		var logTable = System.findNode("//table[@border='0' and @cellpadding='2' and @width='100%']");
		var hideNextRows = 0;
		for (var i=0;i<logTable.rows.length;i++) {
			var aRow = logTable.rows[i];
			var firstPlayerID = 0;
			var secondPlayerID = 0;
			if (i != 0) {
				if (hideNextRows>0) {
					//aRow.style.display = "none";
					hideNextRows --;
				}
				if (aRow.cells[0].innerHTML) {
					var messageHTML = aRow.cells[2].innerHTML;
					var doublerPlayerMessageRE = /member\s<a\shref="index.php\?cmd=profile\&amp;player_id=(\d+)/
					secondPlayer = doublerPlayerMessageRE.exec(messageHTML);
					var singlePlayerMessageRE = /<a\shref="index.php\?cmd=profile\&amp;player_id=(\d+)/
					firstPlayer = singlePlayerMessageRE.exec(messageHTML);
					if (secondPlayer) {
						firstPlayerID = firstPlayer[1]*1;
						secondPlayerID = secondPlayer[1]*1;
					}
					if (firstPlayer && !secondPlayer) {
						firstPlayerID = firstPlayer[1]*1;
					}
					if (firstPlayerID == playerId || secondPlayerID == playerId) {
					}
					else if (firstPlayer) {
						//aRow.style.display = "none";
						aRow.style.fontSize = "x-small";
						aRow.style.color = "gray";
						hideNextRows = 3;
					}
				}
			}
			else {
				var messageNameCell = aRow.firstChild.nextSibling.nextSibling.nextSibling;
				messageNameCell.innerHTML += "&nbsp;&nbsp;<font style='color:white;'>(Guild Log messages not involving self are dimmed!)</font>"
			}

		}
	},

	injectGuildList: function(memberList) {
		var playerId = Layout.playerId();
		var injectHere = document.getElementById("Helper:GuildListPlaceholder");
		// injectHere.innerHTML=memberList.length;
		var displayList = document.createElement("TABLE");
		displayList.style.border = "1px solid #c5ad73";
		displayList.style.backgroundColor = (memberList.isRefreshed)?"#6a5938":"#4a3918";
		displayList.cellPadding = 1;
		displayList.width = 125;

		var aRow=displayList.insertRow(displayList.rows.length);
		var aCell=aRow.insertCell(0);
		var output = "<ol style='color:#FFF380;font-size:10px;list-style-type:decimal;margin-left:1px;margin-top:1px;margin-bottom:1px;padding-left:20px;'>"+
			"Guild Members <span id='Helper:resetGuildList' style='color:blue; font-size:8px; cursor:pointer; text-decoration:underline;'>Reset</span>";
		var onlineMembers = memberList.members.filter(function (e) {return (e.status=="Online")})
		for (var i=0;i<onlineMembers.length;i++) {
			var member=onlineMembers[i];
			output += "<li style='padding-bottom:0px;'>"
			output += "<a style='color:#CCFF99;font-size:10px;' "
			output += Layout.quickBuffHref(member.id) + ">[b]</a>&nbsp;";
			if (member.id!=playerId) {
				output += "<a style=\"color:#A0CFEC;font-size:10px;\" "
				output += "href=\"" + System.server + "index.php?cmd=message&target_player=" + member.name + "\">[m]";
				output += "</a>";
			}
			else {
				output += "<span style='color:" + displayList.style.backgroundColor + ";'>[m]</span>";
			}
			output += "&nbsp;<a onmouseover=\"tt_setWidth(105);";
			output += "Tip('<div style=\\'text-align:center;width:105px;\\'><b>" + member.rank + "</b>"+
				"<br/>XP: " + System.addCommas(member.xp) +
				"<br/>Level: " + member.level +
				"<br/>Logged in:" + member.loggedInAt.toFormatString("ddd HH:mm");
			if (member.hasFullData) {

			}
			output += "</div>');\" ";
			output += "style='color:"
			if (((new Date()) - member.loggedInAt) < 30000) { // just logged in
				output += "orange";
			}
			else {
				output += (member.id==playerId)?"#FFF380":"white";
			}
			output += ";font-size:10px;'"
			output += " href='" + System.server + "index.php?cmd=profile&player_id=" + member.id + "'>" + member.name + "</a>";
			// output += "<br/>"
			output += "</li>"
		}
		output += "</ol>";
		aCell.innerHTML = output;
		var breaker=document.createElement("BR");
		injectHere.parentNode.insertBefore(breaker, injectHere.nextSibling);
		injectHere.parentNode.insertBefore(displayList, injectHere.nextSibling);
		document.getElementById('Helper:resetGuildList').addEventListener('click', Helper.resetGuildList, true);		
	},

	resetGuildList: function(evt) {
		GM_setValue("memberlist","");
		GM_setValue("oldmemberlist","");
		window.location = window.location;
	},
	
	getFullPlayerData: function(member) {
		return;
		System.xmlhttp("index.php?cmd=profile&player_id=" + member.id, Helper.parsePlayerData, member.id);
	},

	parsePlayerData: function(responseText, memberId) {
		// return;
		var doc=System.createDocument(responseText)
		// var statistics = System.findNode("//table[contains(tr/td/b,'Level:')]",0,doc);
		var statistics = System.findNode("//table[contains(tbody/tr/td/b,'Level:')]",0,doc);
		var levelNode = System.findNode("//td[contains(b,'Level:')]",0,statistics);
		var levelValue = levelNode.nextSibling.innerHTML;
		GM_log(levelValue);
		// GM_log(statistics.innerHTML); //parentNode.parentNode.nextSibling.nextSibling.nextSibling.innerHTML);
	},

	injectBank: function() {
		var injectHere;
		var bank = System.findNode("//b[contains(.,'Bank')]");
		if (bank) {
			bank.innerHTML+="<br><a href='/index.php?cmd=guild&subcmd=bank'>Guild Bank</a>";
		}
	},

	injectAuctionHouse: function() {
		var isAuctionPage = System.findNode("//img[contains(@title,'Auction House')]");
		var imageCell = isAuctionPage.parentNode;
		var imageHTML = imageCell.innerHTML; //hold on to this for later.

		var auctionTable = System.findNode("//img[contains(@title,'Auction House')]/../../../..");

		//Add functionality to hide the text block at the top.
		var textRow = auctionTable.rows[2];
		textRow.id = 'auctionTextControl';
		var myBidsButton = System.findNode("//input[@value='My Bids']/..");
		myBidsButton.innerHTML += " [ <span style='cursor:pointer; text-decoration:underline;' " +
			"id='toggleAuctionTextControl' linkto='auctionTextControl' title='Click on this to Show/Hide the AH text.'>X</span> ]";
		if (GM_getValue("auctionTextControl")) {
			textRow.style.display = "none";
			textRow.style.visibility = "hidden";
		}
		document.getElementById('toggleAuctionTextControl').addEventListener('click', System.toggleVisibilty, true);

		//fix button class and add go to first and last
		var prevButton = System.findNode("//input[@value='<']");
		var nextButton = System.findNode("//input[@value='>']");
		if (prevButton) {
			prevButton.setAttribute("class", "custombutton");
			var startButton = document.createElement("input");
			startButton.setAttribute("type", "button");
			startButton.setAttribute("onclick", prevButton.getAttribute("onclick").replace(/\&page=[0-9]*/, "&page=1"));
			startButton.setAttribute("class", "custombutton");
			startButton.setAttribute("value", "<<");
			prevButton.parentNode.insertBefore(startButton,prevButton);
		};
		if (nextButton) {
			nextButton.setAttribute("class", "custombutton");
			var lastPageNode=System.findNode("//input[@value='Go']/../preceding-sibling::td");
			lastPage = lastPageNode.textContent.replace(/\D/g,"");
			var finishButton = document.createElement("input");
			finishButton.setAttribute("type", "button");
			finishButton.setAttribute("onclick", nextButton.getAttribute("onclick").replace(/\&page=[0-9]*/, "&page=" + lastPage));
			finishButton.setAttribute("class", "custombutton");
			finishButton.setAttribute("value", ">>");
			nextButton.parentNode.insertBefore(finishButton, nextButton.nextSibling);
		};

		//insert another page change block at the top of the screen.
		var insertPageChangeBlockHere = auctionTable.rows[5].cells[0];
		var pageChangeBlock = System.findNode("//input[@name='page' and @class='custominput']/../../../../../..");
		var newPageChangeBlock = pageChangeBlock.innerHTML.replace('</form>','');
		newPageChangeBlock += "</form>"
		var insertPageChangeBlock=document.createElement("SPAN");
		insertPageChangeBlock.innerHTML = newPageChangeBlock;
		insertPageChangeBlockHere.align = "right";
		insertPageChangeBlockHere.appendChild(insertPageChangeBlock);

		var quickSearchList = System.getValueJSON("quickSearchList");

		var finalHTML = "<span style='font-size:x-small; color:blue;'><table><tbody><tr><td rowspan='7'>" + imageHTML + "</td>" +
			"<td colspan='3' style='text-align:center;color:#7D2252;background-color:#CD9E4B'><a style='color:#7D2252' href='" +
						System.server +
						"index.php?cmd=notepad&subcmd=auctionsearch'>" +
						"Configure Quick Search</a></td></tr>";
		var lp=0;
		var rowCount = 0;
		for (var p=0;p<quickSearchList.length;p++) {
			if (lp % 3==0 && rowCount == 6) break; //18 searches on the screen so don't display any more
			var quickSearch=quickSearchList[p];
			if (quickSearch.displayOnAH) {
				if (lp % 3==0) {
					finalHTML += "<tr>";
					rowCount++;
				}
				finalHTML += "<td";
				finalHTML += "><span style='cursor:pointer;text-decoration:underline;color:#7D2252' cat='quickItemSearch' searchtext='" +
					quickSearch.searchname + "' title='" + quickSearch.searchname + "'>" +
					quickSearch.nickname + "</span></td>"
				if (lp % 3==2) finalHTML += "</tr>";
				if (lp % 3==2) finalHTML += "</tr>";
				lp++;
			}
		}
		imageCell.innerHTML = finalHTML;

		var quickItemSearchList = System.findNodes("//span[@cat='quickItemSearch']");
		if (quickItemSearchList) {
			for (var i=0; i<quickItemSearchList.length; i++) {
				quickSearchItem = quickItemSearchList[i];
				quickSearchItem.addEventListener('click', Helper.quickAuctionSearch, true);
			}
		}

		var allItems = document.getElementsByTagName("IMG");
		for (var i=0; i<allItems.length; i++) {
			anItem = allItems[i];
			if (anItem.src.search("items") != -1) {
				var theImage = anItem;
				System.xmlhttp(Helper.linkFromMouseover(anItem.getAttribute("onmouseover")),
					function(responseText, callback) {
						var craft="";
						if (responseText.search(/Uncrafted|Very Poor|Poor|Average|Good|Very Good|Excellent|Perfect/) != -1){
							var fontLineRE=/<\/b><\/font><br>([^<]+)(<font color='(#[0-9A-F]{6})'>[^<]+<\/font>)/;
							var fontLineRX=fontLineRE.exec(responseText);
							craft = fontLineRX[2];
						}
						var forgeCount=0, re=/hellforge\/forgelevel.gif/ig;
						while(re.exec(responseText)) {
							forgeCount++;
						}
						if (responseText.search(/Crystalline/) != -1) {
							var durabilityRE =/<font color='#999999'>Durability:<\/font><\/nobr><\/td><td width='50%' align='right'>(\d+)\&nbsp;\/\&nbsp;(\d+)\&nbsp;/;
							var durability = '<span style="font-size:x-small; color:gray;"><br>Dur: ' + 
								durabilityRE.exec(responseText)[1] + '/' + durabilityRE.exec(responseText)[2] + '</span>';
						}
						Helper.injectAuctionExtraText(this.callback,craft,forgeCount,durability);
					},
					theImage);
			}
		}
		var minBidLink = System.findNode("//a[contains(@href,'&order_by=1')]");
		var buyNowLink = System.findNode("//a[contains(@href,'&order_by=2')]");
		var timeLeftLink = System.findNode("//a[contains(@href,'&order_by=0')]");
		var auctionTable = minBidLink.parentNode.parentNode.parentNode.parentNode;
		//fix min bid, bid now and time left links from the player AH page
		var thisLink = window.location.href;
		var regExpr = new RegExp("tid=([0-9]+)");
		if (thisLink.match(regExpr)){
			var rezReg = regExpr.exec(thisLink);
			//correct links
			minBidLink.href = minBidLink.href+'&'+rezReg[0];
			buyNowLink.href = buyNowLink.href+'&'+rezReg[0];
			timeLeftLink.href = timeLeftLink.href+'&'+rezReg[0];
		}

		var playerId = Layout.playerId();

		var memberList = System.getValueJSON("memberlist");
		var memberNameString = "";
		if (memberList) {
			for (var i=0;i<memberList.members.length;i++) {
				var member=memberList.members[i];
				memberNameString += member.name + " ";
			}
		}
		var listOfEnemies = GM_getValue("listOfEnemies");
		if (!listOfEnemies) listOfEnemies = "";
		var listOfAllies = GM_getValue("listOfAllies");
		if (!listOfAllies) listOfAllies = "";

		var newRow, newCell, winningBidBuyoutCell;
		for (var i=0;i<auctionTable.rows.length;i++) {
			var aRow = auctionTable.rows[i];
			if (i>0 && // the title row - ignore this
				aRow.cells[1]) { // a separator row - ignore this
				if (aRow.cells[5].innerHTML == '<font size="1">[ended]</font>') { //time left column
					aRow.cells[6].innerHTML = ""; // text field and button column
				} else {
					winningBidValue = "-";
					var bidExistsOnItem = false;
					var playerListedItem = false;
					if (aRow.cells[1].innerHTML != '<font size="1">Auction House</font>') {
						var sellerElement = aRow.cells[1].firstChild.firstChild;
						sellerHref = sellerElement.getAttribute("href");
						var sellerIDRE = /player_id=(\d+)/;
						var sellerID = sellerIDRE.exec(sellerHref)[1];
						if (playerId == sellerID) {
							playerListedItem = true;
						}
					}
					if (aRow.cells[3].innerHTML != '<font size="1">-</font>') {
						var winningBidTable = aRow.cells[3].firstChild.firstChild;
						var winningBidCell = winningBidTable.rows[0].cells[0];
						var winningBidderCell = winningBidTable.rows[1].cells[0].firstChild.nextSibling;
						var winningBidder = winningBidderCell.innerHTML;
						if (memberNameString.search(winningBidder) !=-1) {
							winningBidderCell.style.color="green";
						}
						if (listOfEnemies.search(winningBidder) !=-1) {
							winningBidderCell.style.color="red";
						}
						if (listOfAllies.search(winningBidder) !=-1) {
							winningBidderCell.style.color="blue";
						}
						var isGold = winningBidTable.rows[0].cells[1].firstChild.getAttribute("title")=="Gold";
						var winningBidValue = System.intValue(winningBidCell.textContent);
						newRow = winningBidTable.insertRow(2);
						winningBidBuyoutCell = newRow.insertCell(0);
						winningBidBuyoutCell.colSpan = "2";
						winningBidBuyoutCell.align = "center";
						var winningBidderHTML = winningBidTable.rows[1].cells[0].innerHTML;
						var winningBidderIDRE = /player_id=(\d+)/;
						var winningBidderID = winningBidderIDRE.exec(winningBidderHTML)[1];
						if (playerId == winningBidderID) {
							playerListedItem = true;
						}
					}
					if (winningBidValue != "-" && !bidExistsOnItem && !playerListedItem) {
						var overBid = isGold?Math.ceil(winningBidValue * 1.05):(winningBidValue+1);
						winningBidBuyoutCell.innerHTML = '<span style="color:blue;" title="Overbid value">Overbid ' + System.addCommas(overBid) + '</span>&nbsp';
					}
					var inputTableCell;
					if (!playerListedItem) {
						var inputTable = aRow.cells[6].firstChild.firstChild;
						var inputCell = inputTable.rows[0].cells[0];
						var textInput = inputCell.firstChild;
						textInput.id = 'auction' + i + 'text';
						var bidCell = inputTable.rows[0].cells[1];
						bidCell.align = "right";
						//spacer row
						newRow = inputTable.insertRow(1);
						inputTableCell = newRow.insertCell(0);
						inputTableCell.colSpan = "2";
						inputTableCell.height = "2";
						//get itemID for bid no refresh
						var itemIMG = aRow.cells[0].firstChild;
						var itemStats = /ajaxLoadItem\((\d+), (\d+), (\d+), (\d+)/.exec(itemIMG.getAttribute("onmouseover"));
						invID = itemStats[2];
						//new bid no refresh button
						newRow = inputTable.insertRow(2);
						inputTableCell = newRow.insertCell(0);
						inputTableCell.colSpan = "2";
						inputTableCell.align = "center";
						inputTableCell.innerHTML = '<span id="auction' + i + 'text">'+
							'<input id="bidNoRefresh" invID="'+ invID +
								'" linkto="auction' + i + 'text" value="Bid no Refresh" class="custombutton" type="submit"></span>';
					}
					var inputText = aRow.cells[6]
				}
			}
		}
		bidNoRefreshList = System.findNodes("//input[@id='bidNoRefresh']");		
		if (bidNoRefreshList) {		
			for (var i=0; i<bidNoRefreshList.length; i++) {		
				var bidNoRefreshItem = bidNoRefreshList[i];		
				bidNoRefreshItem.addEventListener('click', Helper.bidNoRefresh, true);		
			}		
		}

		var searchPrefs = System.findNode("//a[contains(@href, 'cmd=auctionhouse&subcmd=preferences')]");
		var preparePreferences = System.findNode("//a[contains(@href, 'cmd=auctionhouse&subcmd=preferences')]/../../../..");
		searchPrefs.setAttribute("href", "#prefs");

		var newRow = document.createElement("TR");
		var newCell = newRow.insertCell(0);
		newCell.setAttribute("colspan", 5);

		newCell.innerHTML = '<div id="Helper:AuctionHousePreferences" style="font-size:xx-small;text-align:right;visibility:hidden;display:none;">' +
			'<form onsubmit="return false;">' +
			'&nbsp;Min: <input type=text size=3 style="font-size:xx-small" class=custominput name=pref_minlevel value="wait" />' +
			'&nbsp;Max: <input type=text size=3 style="font-size:xx-small" class=custominput name=pref_maxlevel value="wait" />' +
			'&nbsp;Gold: <input type=checkbox style="font-size:xx-small" class=custominput name=pref_hidegold value="1" />' +
			'&nbsp;FSP: <input type=checkbox style="font-size:xx-small" class=custominput name=pref_hidefsp value="1" />' +
			'<input type=submit class=custombutton id="Helper:AuctionHouseSavePreferences" value="Save" /></form></div>';

		// preparePreferences.appendChild(prefArea);
		preparePreferences.appendChild(newRow);

		searchPrefs.addEventListener("click", Helper.auctionHouseTogglePreferences, true);
		document.getElementById("Helper:AuctionHouseSavePreferences").addEventListener("click", Helper.auctionHouseSavePreferences, true);
		// document.getElementById("Helper:QuickSearch").addEventListener("click", Helper.auctionHouseQuickSearch, true);

		//litte something to default to sorting by min bid
		var hiddenOrderByInput = System.findNode("//input[@name='order_by']");
		hiddenOrderByInput.value = 1;

		Helper.injectAuctionQuickCancel();
	},

	bidNoRefresh: function(evt) {
		var inputValue = System.findNode("//input[@id='" + evt.target.getAttribute("linkto") + "']");
		var invID = evt.target.getAttribute("invID");
		var postData = "cmd=auctionhouse&subcmd=placebid" +
				"&auction_id=" + invID +
				"&page=" +
				"&type=-1" +
				"&bid=" + inputValue.value;

		GM_xmlhttpRequest({
			method: 'POST',
			url: System.server + "index.php",
			headers: {
				"User-Agent" : navigator.userAgent,
				"Referer": System.server + "index.php?cmd=auctionhouse&subcmd=type=-1",
				"Cookie" : document.cookie,
				"Content-Type": "application/x-www-form-urlencoded"
			},
			data: postData,
			onload: function(responseDetails) {
				var info = Layout.infoBox(responseDetails.responseText);
				var infoElement = evt.target.parentNode;
				if (info.search("Bid placed successfully!") != -1) {
					infoElement.innerHTML = " <span style='color:green; font-weight:bold;'>" + info + "</span>";
				} else {
					infoElement.innerHTML = " <span style='color:red; font-weight:bold;'>" + info + "</span>";
				}
			}
		})
	},
	
	auctionHouseTogglePreferences: function(evt) {
		var prefArea = document.getElementById("Helper:AuctionHousePreferences");
		if (prefArea.style.display!="none") {
			prefArea.style.visibility="hidden";
			prefArea.style.display="none";
		} else {
			prefArea.style.visibility="visible";
			prefArea.style.display="block";
		}
		if (prefArea.getAttribute("populated")!="done") {
			System.xmlhttp('index.php?cmd=auctionhouse&subcmd=preferences', Helper.auctionHouseGetPreferences)
		}
		return false;
	},

	auctionHouseGetPreferences: function(responseText) {
		var doc=System.createDocument(responseText);
		var minLevel = System.findNode("//input[@name='pref_minlevel']", doc).value;
		var maxLevel = System.findNode("//input[@name='pref_maxlevel']", doc).value;
		var hideGold = System.findNode("//input[@name='pref_hidegold']", doc).checked;
		var hideFsp = System.findNode("//input[@name='pref_hidefsp']", doc).checked;
		var prefArea = document.createElement("DIV");

		System.findNode("//input[@name='pref_minlevel']").value   = minLevel;
		System.findNode("//input[@name='pref_maxlevel']").value   = maxLevel;
		System.findNode("//input[@name='pref_hidegold']").checked = hideGold;
		System.findNode("//input[@name='pref_hidefsp']").checked   = hideFsp;
		document.getElementById("Helper:AuctionHousePreferences").setAttribute("populated", "done");
	},

	auctionHouseSavePreferences: function(evt) {
		var minLevel = System.findNode("//input[@name='pref_minlevel']").value;
		var maxLevel = System.findNode("//input[@name='pref_maxlevel']").value;
		var hideGold = System.findNode("//input[@name='pref_hidegold']").checked;
		var hideFsp = System.findNode("//input[@name='pref_hidefsp']").checked;

		var submitButton=document.getElementById("Helper:AuctionHouseSavePreferences")
		submitButton.disabled=true;
		submitButton.value="Saving..."

		var postData = "cmd=auctionhouse&subcmd=savepreferences" +
				"&pref_minlevel=" + minLevel +
				"&pref_maxlevel=" + maxLevel +
				(hideGold?"&pref_hidegold=1":"") +
				(hideFsp?"&pref_hidefsp=1":"")

		GM_xmlhttpRequest({
			method: 'POST',
			url: System.server + "index.php",
			headers: {
				"User-Agent" : navigator.userAgent,
				"Referer": System.server + "index.php?cmd=auctionhouse&subcmd=preferences",
				"Cookie" : document.cookie,
				"Content-Type": "application/x-www-form-urlencoded"
			},
			data: postData,
			onload: function(responseDetails) {
				Helper.auctionHouseSavePreferencesDone(responseDetails.responseText);
			}
		})
	},

	auctionHouseSavePreferencesDone: function(responseText) {
		var submitButton=document.getElementById("Helper:AuctionHouseSavePreferences")
		submitButton.disabled=false;
		submitButton.value="Save";
		submitButton.blur();
	},

	quickAuctionSearch: function(evt) {
		var searchText = evt.target.getAttribute("searchtext");
		GM_log(searchText);
		var searchInputTextField = System.findNode("//input[@name='search_text' and @class='custominput']");
		var searchURL = System.server + "index.php?cmd=auctionhouse&type=-1&search_text=" + searchText + "&page=1&order_by=1";
		window.location = searchURL;
	},

	injectAuctionExtraText: function(anItem, craft, forgeCount, durability) {
		var theText=anItem.parentNode.nextSibling.nextSibling;
		//Excellent color does not show up well so change Perfect to Green and Excellent takes the yellow color
		// to show up better in the AH.
		craft = craft.replace(/\#F6ED00/,"#00B600");
		craft = craft.replace(/\#F6AE00/,"#F6ED00");
		var preText = "<span style='color:blue'>" + craft + "</span>";
		if (forgeCount != 0) {
			preText +=  " " + forgeCount + "<img src='" + System.imageServer + "/hellforge/forgelevel.gif'>"
		}
		if (durability) preText += durability;
		theText.innerHTML = preText + "<br>" + theText.innerHTML;
	},

	toggleShowExtraLinks: function(evt) {
		var showExtraLinksElement = System.findNode("//span[@id='Helper:showExtraLinks']");
		if (showExtraLinksElement.textContent == "Show AH and Sell links") {
			GM_setValue("showExtraLinks", true);
		} else {
			GM_setValue("showExtraLinks", false);
		}
		window.location = window.location;
	},

	toggleShowQuickDropLinks: function(evt) {
		var showQuickDropLinksElement = System.findNode("//span[@id='Helper:showQuickDropLinks']");
		if (showQuickDropLinksElement.textContent == "Show Quick Drop links") {
			if (window.confirm("Are you sure you want to show the quick drop links?")) GM_setValue("showQuickDropLinks", true);
		} else {
			GM_setValue("showQuickDropLinks", false);
		}
		window.location = window.location;
	},

	injectReportPaint: function() {
		var mainTable = System.findNode("//table[@width='600']");
		for (var i=0;i<mainTable.rows.length;i++) {
			var aRow = mainTable.rows[i];
			if (aRow.cells[1]) { // itemRow
				var itemCell = aRow.cells[1];
				var itemElement = itemCell.firstChild;
				var href = itemElement.getAttribute("href");
				//GM_log(href);
				var itemIDRE = /recall\&id=(\d+)/
				var itemID = itemIDRE.exec(href)[1];
				var playerIDRE = /player_id=(\d+)/
				var playerID = playerIDRE.exec(href)[1];
				//itemCell.title = itemID;
				//ajaxLoadItem(2758, 84063685, 1, 1346893 - report link
				//ajaxLoadItem(2758, 6569239, 4, 40769 - guild store link
				//unfortunately the itemID for the report link is different than the guild store link so you cannot script
				//grabbing items from the guild store easily with one click.
				itemCell.innerHTML += ' [ <span style="cursor:pointer; text-decoration:underline;" id="recallItem' + itemID + '" ' +
					'itemID="' + itemID + '" ' +
					'playerID="' + playerID + '">Fast Recall</span> ]'
				document.getElementById('recallItem' + itemID).addEventListener('click', Helper.recallItem, true);
			}
		}

		//Get the list of online members
		var memberList = System.getValueJSON("memberlist");

		var injectHere, searchString;
		if (memberList) {
			for (var i=0;i<memberList.members.length;i++) {
				var member=memberList.members[i];
				if (member.status=="Online") {
					var player=System.findNode("//b[contains(., '" + member.name + "')]");
					if (player) {
						player.innerHTML = "<span style='font-size:large; color:green;'>[Online]</span> <a href='" +
							System.server + "index.php?cmd=profile&player_id=" + member.id + "'>" + player.innerHTML + "</a>";
						player.innerHTML += " [ <a href='index.php?cmd=message&target_player=" + member.name + ">m</a> ]";
					}
				}
				else {
					var player=System.findNode("//b[contains(., '" + member.name + "')]");
					if (player) {
						player.innerHTML = "<a href='" +
							System.server + "index.php?cmd=profile&player_id=" + member.id + "'>" + player.innerHTML + "</a>";
					}
				}
			}
		}
	},

	recallItem: function(evt) {
		var itemID=evt.target.getAttribute("itemID");
		var playerID=evt.target.getAttribute("playerID");
		System.xmlhttp("index.php?cmd=guild&subcmd=inventory&subcmd2=recall&id=" + itemID + "&player_id=" + playerID, Helper.recallItemReturnMessage, {"item": itemID, "target": evt.target});
	},

	recallItemReturnMessage: function(responseText, callback) {
		var itemID = callback.item;
		var target = callback.target;
		var info = Layout.infoBox(responseText);
		var itemCellElement = target.parentNode; //System.findNode("//td[@title='" + itemID + "']");
		if (info.search("You successfully recalled the item") != -1) {
			itemCellElement.innerHTML += " <span style='color:green; font-weight:bold;'>" + info + "</span>";
		} else {
			itemCellElement.innerHTML += " <span style='color:red; font-weight:bold;'>" + info + "</span>";
		}
	},

	changeCombatSet: function(responseText, itemIndex) {
		var doc=System.createDocument(responseText);

		var cbsSelect = System.findNode("//select[@name='combatSetId']", doc);

		// find the combat set id value
		var allItems = cbsSelect.getElementsByTagName("option");
		if (itemIndex >= allItems.length) return;
		var cbsIndex = allItems[itemIndex].value;

		GM_xmlhttpRequest({
			method: 'POST',
			url: System.server + "index.php",
			headers: {
				"User-Agent" : navigator.userAgent,
				"Content-Type": "application/x-www-form-urlencoded",
				"Referer": System.server + "index.php?cmd=profile",
				"Cookie" : document.cookie
			},
			data: "cmd=profile&subcmd=managecombatset&combatSetId="+cbsIndex+"&submit=Use",
			onload: function() {
				window.location="index.php?cmd=profile";
			}
		})
	},

	injectDropItems: function() {
		var mainTable = System.findNode("//table[@width='600']");
		var showExtraLinks = GM_getValue("showExtraLinks");
		var showQuickDropLinks = GM_getValue("showQuickDropLinks");
		if (mainTable) {
			var insertHere = mainTable.rows[5].cells[0];
			insertHere.innerHTML += '[<span style="cursor:pointer; text-decoration:underline; color:blue;" id="Helper:showExtraLinks">' +
				(showExtraLinks?'Hide':'Show') + ' AH and Sell links</span>]&nbsp;';
			insertHere.innerHTML += '[<span style="cursor:pointer; text-decoration:underline; color:blue;" id="Helper:showQuickDropLinks">' +
				(showQuickDropLinks?'Hide':'Show') + ' Quick Drop links</span>]&nbsp;';
			document.getElementById("Helper:showExtraLinks").addEventListener('click', Helper.toggleShowExtraLinks, true);
			document.getElementById("Helper:showQuickDropLinks").addEventListener('click', Helper.toggleShowQuickDropLinks, true);
		}

		//function to add links to all the items in the drop items list
		if (showExtraLinks || showQuickDropLinks) {
			var itemName, itemInvId, theTextNode, newLink;
			var allItems=System.findNodes("//input[@type='checkbox']");
			if (allItems) {
				for (var i=0; i<allItems.length; i++) {
					anItem = allItems[i];
					itemInvId = anItem.value;
					theTextNode = System.findNode("../../td[3]", anItem);
					theImgElement = System.findNode("../../td[2]", anItem).firstChild.firstChild;
					itemStats = /ajaxLoadItem\((\d+), (\d+), (\d+), (\d+)/.exec(theImgElement.getAttribute("onmouseover"));
					if (itemStats) {
						itemId = itemStats[1];
						invId = itemStats[2];
						type = itemStats[3];
						pid = itemStats[4];
					}
					itemName = theTextNode.textContent.trim().replace("\\","");
					theTextNode.textContent = itemName;
					var findItems = System.findNodes('//td[@width="90%" and contains(.,"'+itemName+'")]');
					var preText = "", postText1 = "", postText2 = "";
					if (showExtraLinks) {
						preText = "<span findme='AH'>[<a href='" + System.server + "?cmd=auctionhouse&type=-1&order_by=1&search_text="
							+ escape(itemName)
							+ "'>AH</a>]</span> "
							+ "<span findme='Sell'>[<a href='" + System.server + "index.php?cmd=auctionhouse&subcmd=create2"
							+ "&inv_id=" + itemInvId 
							+ "&item_id=" + itemId
							+ "&type=" + type
							+ "&pid=" + pid + "'>"
							+ "Sell</a>]</span> ";
					}
					postText1 = ((findItems.length>1)?' [<span findme="checkall" linkto="'
						+ itemName
						+ '" style="text-decoration:underline;cursor:pointer">Check all</span>]':'');
					if (showQuickDropLinks) {
						postText2 = "&nbsp;<span  title='INSTANTLY DROP THE ITEM. NO REFUNDS OR DO-OVERS! Use at own risk.' id='Helper:QuickDrop"
							+ itemInvId
							+ "' itemInvId="
							+ itemInvId
							+ " findme='QuickDrop' style='color:red; cursor:pointer; text-decoration:underline;'>[Quick Drop]</span> ";
					}
					
					theTextNode.innerHTML = preText
						+ theTextNode.innerHTML
						+ postText1
						+ postText2;
					if (showQuickDropLinks) {
						document.getElementById("Helper:QuickDrop"+itemInvId).addEventListener('click', Helper.quickDropItem, true);
					}
				}
			}
		}

		var checkAllElements = System.findNodes("//span[@findme='checkall']");
		if (checkAllElements) {
			for (var i=0; i<checkAllElements.length; i++) {
				checkAllElement = checkAllElements[i];
				itemName = checkAllElement.linkto;
				checkAllElement.addEventListener('click', Helper.checkAll, true);
			}
		}

		var allItems = System.findNodes("//input[@type='checkbox']");
		if (allItems) {
			for (var i=0; i<allItems.length; i++) {
				anItem = allItems[i];
				theLocation=anItem.parentNode.nextSibling.nextSibling;
				theImage=anItem.parentNode.nextSibling.firstChild.firstChild;
				System.xmlhttp(Helper.linkFromMouseover(theImage.getAttribute("onmouseover")), Helper.injectDropItemsPaint, theImage);
			}
		}
	},

	quickDropItem: function(evt){
		var itemInvId = evt.target.getAttribute("itemInvId");
		var dropItemHref = "http://www.fallensword.com/index.php?cmd=profile&subcmd=dodropitems&removeIndex[]=" + itemInvId;
		System.xmlhttp(dropItemHref,
			Helper.quickDropItemReturnMessage,
			{"target": evt.target});
	},

	quickDropItemReturnMessage: function(responseText, callback) {
		var target = callback.target;
		var info = Layout.infoBox(responseText);
		target.style.cursor = 'default';
		target.style.textDecoration = 'none';
		if (info.search("Items dropped and destroyed.") != -1) {
			target.style.color = 'green';
			target.style.fontWeight = 'bold';
			target.style.fontSize = 'small';
			target.innerHTML = "Item Dropped";
		} else {
			target.style.color = 'red';
			target.style.fontWeight = 'bold';
			target.style.fontSize = 'small';
			target.innerHTML = "Error:" + info;
		}
	},

	checkAll: function(evt){
		var itemName = evt.target.getAttribute("linkto");
		var findItems = System.findNodes("//td[@width='90%' and contains(.,'"+itemName+"')]");
		for (var i=0; i<findItems.length; i++) {
			var item = findItems[i];
			var checkboxForItem = item.previousSibling.previousSibling.firstChild;
			if (checkboxForItem.checked) {
				checkboxForItem.checked = false;
			} else {
				checkboxForItem.checked = true;
			}

		}
	},

	injectDropItemsPaint: function(responseText, callback) {
		var textNode = System.findNode("../../../td[3]", callback);
		var auctionHouseLink=System.findNode("span[@findme='AH']", textNode);
		var sellLink=System.findNode("span[@findme='Sell']", textNode);
		var quickDropLink=System.findNode("span[@findme='QuickDrop']", textNode);
		var guildLockedRE = /<center>Guild Locked: <font color="#00FF00">/i;
		if (guildLockedRE.exec(responseText)) {
			if (auctionHouseLink) auctionHouseLink.style.visibility='hidden';
			if (sellLink) sellLink.style.visibility='hidden';
			if (quickDropLink) quickDropLink.style.visibility='hidden';
		};
		//<font color='cyan'>Bound (Non-Tradable)</font></b> <font color='orange'>Quest Item </font></center>
		var boundItemRE = /Bound \(Non-Tradable\)/i;
		if (boundItemRE.exec(responseText)) {
			if (auctionHouseLink) auctionHouseLink.style.visibility='hidden';
			if (sellLink) sellLink.style.visibility='hidden';
			if (quickDropLink) quickDropLink.style.visibility='hidden';
		};
		if (GM_getValue("disableItemColoring")) return;
		var fontLineRE=/<center><font color='(#[0-9A-F]{6})' size=2>/i;
		var fontLineRX=fontLineRE.exec(responseText);
		var color=fontLineRX[1];
		if (color=="#FFFFFF") {
			var fontLineRE2=/<br>\s*<font color='([a-z]+)'>/i;
			var fontLineRX2=fontLineRE2.exec(responseText);
			if (fontLineRX2) {
				color=fontLineRX2[1];
			}
		}
		if (color=="#40FFFF") color="#00A0A0";
		if (color=="orange") color="#FF6000";
		if (color=="#00FF00") color="#00B000";
		textNode.style.color=color;
	},

	injectProfile: function() {
		var allLinks = document.getElementsByTagName("A");
		for (var i=0; i<allLinks.length; i++) {
			aLink=allLinks[i];
			if (aLink.href.search("cmd=guild&subcmd=view") != -1) {
				var guildIdResult = /guild_id=([0-9]+)/i.exec(aLink.href);
				if (guildIdResult) var guildId = parseInt(guildIdResult[1], 10);
				var warning = document.createElement('span');
				var color = "";
				var changeAppearance = true;
				var relationship = Helper.guildRelationship(aLink.text);
				switch (relationship) {
					case "self":
						var settings="guildSelfMessage";
						break;
					case "friendly":
						var settings="guildFrndMessage";
						break;
					case "old":
						var settings="guildPastMessage";
						break;
					case "enemy":
						var settings="guildEnmyMessage";
						break;
					default:
						changeAppearance = false;
				}
				if (changeAppearance) {
					var settingsAry=GM_getValue(settings).split("|");
					warning.innerHTML="<br/>" + settingsAry[1];
					color = settingsAry[0];
					aLink.parentNode.style.color=color;
					aLink.style.color=color;
					aLink.parentNode.insertBefore(warning, aLink.nextSibling);
				}
			}
		}

		var player = System.findNode("//textarea[@id='holdtext']");
		var avyrow = System.findNode("//img[contains(@title, 's Avatar')]");
		if (!avyrow) return;
		var playeridRE = document.URL.match(/player_id=(\d+)/);
		if (playeridRE) var playerid=playeridRE[1];
		var idindex, newhtml;

		if (player) {
			if (!playerid) {
				playerid = player.innerHTML;
				idindex = playerid.indexOf("?ref=") + 5;
				playerid = playerid.substr(idindex);
			}

			var playeravy = avyrow.parentNode.firstChild ;
			while ((playeravy.nodeType == 3)&&(!/\S/.test(playeravy.nodeValue))) {
				playeravy = playeravy.nextSibling ;
			}
			var playername = playeravy.getAttribute("title");
			playeravy.style.borderStyle="none";
			playername = playername.substr(0, playername.indexOf("'s Avatar"));

			var auctiontext = "Go to " + playername + "'s auctions" ;
			var ranktext = "Rank " +playername + "" ;
			var securetradetext = "Create Secure Trade to " + playername;

			newhtml = avyrow.parentNode.innerHTML +
				"</td></tr><tr><td align='center' colspan='2'>" +
				"<a " + Layout.quickBuffHref(playerid) + ">" +
				"<img alt='Buff " + playername + "' title='Buff " + playername + "' src=" +
				System.imageServer + "/skin/realm/icon_action_quickbuff.gif></a>&nbsp;&nbsp;" +
				"<a href='" + System.server + "index.php?cmd=guild&subcmd=groups&subcmd2=joinall" +
				"');'><img alt='Join All Groups' title='Join All Groups' src=" +
				System.imageServer + "/skin/icon_action_join.gif></a>&nbsp;&nbsp;" +
				"<a href=" + System.server + "?cmd=auctionhouse&type=-3&tid=" +
				playerid + '><img alt="' + auctiontext + '" title="' + auctiontext + '" src="' +
				System.imageServer + '/skin/gold_button.gif"></a>&nbsp;&nbsp;' +
				"<a href=" + System.server + "index.php?cmd=trade&subcmd=createsecure&target_username=" +
				playername + '><img alt="' + securetradetext + '" title="' + securetradetext + '" src=' +
				System.imageServer + "/temple/2.gif></a>&nbsp;&nbsp;";
			if (relationship == "self" && GM_getValue("showAdmin")) {
				newhtml +=
					"<a href='" + System.server + "index.php?cmd=guild&subcmd=members&subcmd2=changerank&member_id=" +
					playerid + '><img alt="' + ranktext + '" title="' + ranktext + '" src=' +
					System.imageServer + "/guilds/" + guildId + "_mini.jpg></a>";
			}
			avyrow.parentNode.innerHTML = newhtml ;
		}

		var isSelfRE=/player_id=/.exec(document.location.search);
		if (!isSelfRE) { // self inventory
			// Allies/Enemies count/total function
			var alliesTotal = GM_getValue("alliestotal");
			var alliesParent = System.findNode("//b[.='Allies']/..");
			var alliesTable = alliesParent.parentNode.parentNode.parentNode.parentNode.parentNode.nextSibling.nextSibling.nextSibling.nextSibling;
			if (alliesTable) {
				var numberOfAllies = 0;
				var startIndex = 0;
				while (alliesTable.innerHTML.indexOf("/avatars/", startIndex+1) != -1) {
					numberOfAllies ++;
					startIndex = alliesTable.innerHTML.indexOf("/avatars/",startIndex+1);
				}
				startIndex = 0;
				while (alliesTable.innerHTML.indexOf("/skin/player_default.jpg", startIndex+1) != -1) {
					numberOfAllies ++;
					startIndex = alliesTable.innerHTML.indexOf("/skin/player_default.jpg",startIndex+1);
				}
				alliesParent.innerHTML += "&nbsp<span style='color:blue'>" + numberOfAllies + "</span>";
				if (alliesTotal && alliesTotal >= numberOfAllies) {
					alliesParent.innerHTML += "/<span style='color:blue' findme='alliestotal'>" + alliesTotal + "</span>";
				}
			}
			var enemiesTotal = GM_getValue("enemiestotal");
			var enemiesParent = System.findNode("//b[.='Enemies']/..");
			var enemiesTable = enemiesParent.parentNode.parentNode.parentNode.parentNode.parentNode.nextSibling.nextSibling.nextSibling.nextSibling;
			if (enemiesTable) {
				var numberOfEnemies = 0;
				var startIndex = 0;
				while (enemiesTable.innerHTML.indexOf("/avatars/", startIndex+1) != -1) {
					numberOfEnemies ++;
					startIndex = enemiesTable.innerHTML.indexOf("/avatars/",startIndex+1);
				}
				var startIndex = 0;
				while (enemiesTable.innerHTML.indexOf("/skin/player_default.jpg", startIndex+1) != -1) {
					numberOfEnemies ++;
					startIndex = enemiesTable.innerHTML.indexOf("/skin/player_default.jpg",startIndex+1);
				}
				enemiesParent.innerHTML += "&nbsp;<span style='color:blue'>" + numberOfEnemies + "</span>";
				if (enemiesTotal && enemiesTotal >= numberOfEnemies) {
					enemiesParent.innerHTML += "/<span style='color:blue' findme='enemiestotal'>" + enemiesTotal + "</span>";
				}
			}

			//store a list of allies and enemies for use in coloring
			listOfAllies = "";
			if (alliesTable) {
				var alliesTableActual = alliesTable.firstChild.nextSibling.firstChild.nextSibling
				for (var i=0;i<alliesTableActual.rows.length;i++) {
					var aRow = alliesTableActual.rows[i];
					for (var j=0;j<alliesTableActual.rows[i].cells.length;j++) {
						var aCell = aRow.cells[j];
						if (aCell.firstChild.firstChild.nextSibling) {
							var allyNameTable = aCell.firstChild.firstChild.nextSibling.nextSibling;
							var allyName = allyNameTable.rows[0].cells[1].firstChild.textContent;
							listOfAllies += allyName + " ";
						}
					}
				}
			}

			listOfEnemies = "";
			if (enemiesTable) {
				var enemiesTableActual = enemiesTable.firstChild.nextSibling.firstChild.nextSibling
				for (var i=0;i<enemiesTableActual.rows.length;i++) {
					var aRow = enemiesTableActual.rows[i];
					for (var j=0;j<enemiesTableActual.rows[i].cells.length;j++) {
						var aCell = aRow.cells[j];
						if (aCell.firstChild.firstChild.nextSibling) {
							var enemyNameTable = aCell.firstChild.firstChild.nextSibling.nextSibling;
							var enemyName = enemyNameTable.rows[0].cells[1].firstChild.textContent;
							listOfEnemies += enemyName + " ";
						}
					}
				}
			}
			GM_setValue("listOfAllies", listOfAllies);
			GM_setValue("listOfEnemies", listOfEnemies);

			// Fast Wear
			var profileInventory = System.findNode("//table[tbody/tr/td/center/a[contains(@href,'subcmd=equipitem')]]");
			if (profileInventory) {
				var profileInventoryIDRE = /inventory_id=(\d+)/i;
				var foldersEnabled = System.findNode("//img[@src='"+System.imageServer+"/folder_on.gif']");

				var profileInventoryBox = [];
				var profileInventoryBoxItem = [];
				var profileInventoryBoxID = [];
				for (var i=0;i<12;i++) {
					if (foldersEnabled) {
						if (profileInventory.rows[2*(i >> 2)]) profileInventoryBox[i]=profileInventory.rows[2*(i >> 2)].cells[i % 4];
					} else {
						if (profileInventory.rows[i >> 2]) profileInventoryBox[i]=profileInventory.rows[i >> 2].cells[i % 4];
					}
					if (profileInventoryBox[i]) profileInventoryBoxItem[i] = profileInventoryBox[i].firstChild;
					if (profileInventoryBoxItem[i]) {
						var itemHREF = profileInventoryBoxItem[i].firstChild.getAttribute("href");
						if (itemHREF && profileInventoryIDRE(itemHREF)) profileInventoryBoxID[i] = profileInventoryIDRE(itemHREF)[1];
					}
				}

				var newRow;

				for (var i=0;i<12;i++) {
					if ((i % 4==0) && profileInventoryBoxItem[i] && !foldersEnabled) newRow = profileInventory.insertRow(2*(i >> 2)+1);
					if ((i % 4==0) && profileInventoryBoxItem[i] && foldersEnabled) newRow = profileInventory.insertRow(3*(i >> 2)+1);
					if (profileInventoryBoxItem[i] && profileInventoryBoxID[i]) {
						var itemOnmouseover = profileInventoryBoxItem[i].firstChild.firstChild.getAttribute("onmouseover");
						if (itemOnmouseover.indexOf("Equip") != -1) { // check to see if item is equipable.
							var output = '<span style="cursor:pointer; text-decoration:underline; color:blue; font-size:x-small;" '+
									'id="Helper:equipProfileInventoryItem' + profileInventoryBoxID[i] + '" ' +
									'itemID="' + profileInventoryBoxID[i] + '">Wear</span>';
							var newCell = newRow.insertCell(i % 4);
							newCell.align = 'center';
							newCell.innerHTML = output;
							document.getElementById('Helper:equipProfileInventoryItem' + profileInventoryBoxID[i])
								.addEventListener('click', Helper.equipProfileInventoryItem, true);
						}
						else {
							var newCell = newRow.insertCell(i % 4); // dummy cell if we don't put a wear link up.
						}
					} else if (profileInventoryBoxItem[i] && !profileInventoryBoxID[i]){
						var newCell = newRow.insertCell(i % 4); // dummy cell if we don't put a wear link up.
					}
				}
			}
		}

		//bio compressor ...
		var bioCompressorEnabled = GM_getValue("enableBioCompressor");
		if (bioCompressorEnabled) {
			var bioTable = System.findNode("//table[tbody/tr/td/b[.='Biography']]");
			var bioCell = bioTable.rows[6];
			if (bioCell) { //non-self profile
				var bioContents = bioCell.cells[0].innerHTML;
				var maxCharactersToShow = GM_getValue("maxCompressedCharacters");;
				var maxRowsToShow = GM_getValue("maxCompressedLines");;
				var numberOfLines = bioContents.substr(0,maxCharactersToShow).split(/<br>\n/).length - 1;
				if (numberOfLines >= maxRowsToShow) {
					var startIndex = 0;
					while (maxRowsToShow >= 0) {
						maxRowsToShow --;
						startIndex = bioContents.indexOf("<br>\n",startIndex+1);
					}
					maxCharactersToShow = startIndex;
				}
				if (bioContents.length>maxCharactersToShow) {
					//find the end of next HTML tag after the max characters to show.
					var breakPoint = bioContents.indexOf(">",maxCharactersToShow) + 1;
					var bioStart = bioContents.substring(0,breakPoint);
					var bioEnd = bioContents.substring(breakPoint,bioContents.length);
					var extraOpenHTML = "", extraCloseHTML = "";
					var boldCloseTagIndex = bioEnd.indexOf("</b>");
					var boldOpenTagIndex = bioEnd.indexOf("<b>");
					if (boldCloseTagIndex != -1 && boldOpenTagIndex > boldCloseTagIndex) {
						extraOpenHTML += "<b>";
						extraCloseHTML += "</b>";
					}
					var italicsCloseTagIndex = bioEnd.indexOf("</i>");
					var italicsOpenTagIndex = bioEnd.indexOf("<i>");
					if (italicsCloseTagIndex != -1 && italicsOpenTagIndex > italicsCloseTagIndex) {
						extraOpenHTML += "<i>";
						extraCloseHTML += "</i>";
					}
					var underlineCloseTagIndex = bioEnd.indexOf("</u>");
					var underlineOpenTagIndex = bioEnd.indexOf("<u>");
					if (underlineCloseTagIndex != -1 && underlineOpenTagIndex > underlineCloseTagIndex) {
						extraOpenHTML += "<u>";
						extraCloseHTML += "</u>";
					}
					bioCell.innerHTML = bioStart + extraCloseHTML + "<span id='Helper:bioExpander' style='cursor:pointer; text-decoration:underline; color:blue;'>More ...</span>" +
						"<span id='Helper:bioHidden' style='display:none; visibility:hidden;'>" + extraOpenHTML + bioEnd + "</span>";
					document.getElementById('Helper:bioExpander').addEventListener('click', Helper.expandBio, true);
				}
			}
		}
	},

	expandBio: function(evt) {
		var bioExpander = document.getElementById('Helper:bioExpander');
		bioExpander.style.display = 'none';
		bioExpander.style.visibility = 'hidden';
		var bioHidden = document.getElementById('Helper:bioHidden');
		bioHidden.style.display = 'block';
		bioHidden.style.visibility = 'visible';
	},

	equipProfileInventoryItem: function(evt) {
		var InventoryItemID=evt.target.getAttribute("itemID");
		System.xmlhttp("index.php?cmd=profile&subcmd=equipitem&inventory_id=" + InventoryItemID,
			Helper.equipProfileInventoryItemReturnMessage,
			{"item": InventoryItemID, "target": evt.target});
	},

	equipProfileInventoryItemReturnMessage: function(responseText, callback) {
		var itemID = callback.item;
		var target = callback.target;
		var info = Layout.infoBox(responseText);
		var itemCellElement = target.parentNode; //System.findNode("//td[@title='" + itemID + "']");
		if (!info) {
			itemCellElement.innerHTML = "<span style='color:green; font-weight:bold;'>Worn</span>";
		} else {
			itemCellElement.innerHTML = "<span style='color:red; font-weight:bold;'>Error:" + info + "</span>";
		}
	},

	injectQuestManager: function() {
		var content=Layout.notebookContent();
		content.innerHTML='<table cellspacing="0" cellpadding="0" border="0" width="100%">'+
			'<tr><td colspan="2" nobr bgcolor="#cd9e4b"><b>&nbsp;Quest Manager</b></td></tr>'+
			'<tr><td><b>&nbsp;Show Completed Quests <input id="Helper:showCompletedQuests" type="checkbox"' +
				(GM_getValue("showCompletedQuests")?' checked':'') + '/></b></td></tr>'+
			'</table>' +
			'<div style="font-size:small;" id="Helper:QuestManagerOutput">' +
			'Loading quest book...' +
			'</div>';
		Data.questMatrix();
		Helper.parseQuestBookStart(0);
		// Helper.injectQuestTable();
	},

	parseQuestBookStart: function(questPage) {
		System.xmlhttp("index.php?cmd=questbook&page=" + questPage, Helper.parseQuestBookDone, {"page": questPage});
	},

	parseQuestBookDone: function(responseText, callback) {
		var questPage=System.createDocument(responseText);
		var currentPage=callback.page;
		document.getElementById("Helper:QuestManagerOutput").innerHTML+="<br/>Loaded page " + (currentPage+1);
		var pages=System.findNode("//select[@name='page']", questPage);
		if (!pages) return;

		var questRows=System.findNodes("//a[contains(@href,'subcmd=viewquest')]/../..", questPage);
		var questStatus = new Array();
		var questHref = new Array();

		for (var i=0; i<questRows.length; i++) {
			var questRow=questRows[i];
			var questPageQuestName = questRow.cells[0].textContent.replace(/  /g," ");
			questStatus[questPageQuestName]=questRow.cells[1].firstChild.getAttribute("title");
			questHref[questPageQuestName]=questRow.cells[0].firstChild.getAttribute("href");
		}

		for (i=0; i<Data.questArray.length; i++) {
			if (questStatus[Data.questArray[i].questName]!=undefined) {
				Data.questArray[i].status=questStatus[Data.questArray[i].questName];
			}
			if (questHref[Data.questArray[i].questName]!=undefined) {
				Data.questArray[i].href=questHref[Data.questArray[i].questName];
			}
		}

		var nextPage=currentPage+1; //pages[currentPage];
		if (nextPage<pages.options.length) {
			Helper.parseQuestBookStart(nextPage)
		}
		else {
			Helper.injectQuestTable();
		}
	},

	injectQuestTable: function() {
		document.getElementById('Helper:QuestManagerOutput').innerHTML = Helper.generateQuestTable();
		var questTable=document.getElementById('Helper:QuestTable');
		for (var i=0; i<questTable.rows[0].cells.length; i++) {
			var cell=questTable.rows[0].cells[i];
			cell.style.textDecoration="underline";
			cell.style.cursor="pointer";
			cell.addEventListener('click', Helper.sortQuestTable, true);
		}
		document.getElementById("Helper:showCompletedQuests").addEventListener('click', Helper.toggleShowHiddenQuests, true);
	},

	toggleShowHiddenQuests: function(evt) {
		GM_setValue("showCompletedQuests", evt.target.checked);
		Helper.injectQuestTable();
	},

	sortQuestTable: function(evt) {
		var headerClicked=evt.target.getAttribute("sortKey");

		if (Helper.sortAsc==undefined) Helper.sortAsc=true;
		if (Helper.sortBy && Helper.sortBy==headerClicked) {
			Helper.sortAsc=!Helper.sortAsc;
		}
		Helper.sortBy=headerClicked;

		GM_log(headerClicked)

		if (headerClicked=="level") {
			Data.questArray.sort(Helper.numberSort);
		}
		else if (headerClicked=="status") {
			Data.questArray.sort(Helper.questStatusSort);
		}
		else {
			Data.questArray.sort(Helper.stringSort);
		}
		Helper.injectQuestTable();
	},

	generateQuestTable: function() {
		var quests = Data.questMatrix();
		var q, bgColor;
		//GM_log(Helper.characterLevel);
		var hideQuests=[];
		if (GM_getValue("hideQuests")) hideQuests=GM_getValue("hideQuestNames").split(",");
		var output='<br/><table border=0 cellpadding=0 cellspacing=0 width=100% id="Helper:QuestTable">';
		output += '<tr style="background-color:#cd9e4b;"><th sortkey="questName">Name</th><th></th><th sortKey="level">Level</th><th></th>' +
			'<th sortKey="location">Location</th><th sortKey="status">Status</th></tr>';
		var c=0;
		for (var i=0;i<quests.length;i++) {
			q = quests[i];
			if (hideQuests.indexOf(q.questName)<0) {
				var img="";
				// if (q.status==undefined) img="";
				if (q.status=="Completed") img=System.imageServer + "/skin/quest_complete.gif";
				if (q.status=="Incomplete") img=System.imageServer + "/skin/quest_incomplete.gif";
				if (q.status==undefined) img='data:image/png;base64,' +
					'iVBORw0KGgoAAAANSUhEUgAAABMAAAATCAYAAAByUDbMAAAC5UlEQVR4nG1UX2sT' +
					'QRD/7V5yub0kUi4mFFJfWq2i2Jb+0bZYoX2wgk+C6IvfwQf9AH4HP4KCgopvglIK' +
					'FqVafFPf1AdFH7TpH2huzzTJOrObi6npcHd7Nzvzm5nfzJ54dmfWAHSRNPdbcCLQ' +
					'K81mA4FSHZv9Q2wE6ZsQj2/NmEfr30jRhtfYRU427LbOVpyd+efXSBp9MH5G2vX6' +
					'hRFknKqNqwsnugaNuNUN7ivPIdIlpQ/f9/qCPFz5YBWSgYxpkWEW/6wOFwYSgXS3' +
					'cqsX+uTftn6Zrj9HFh1Ao+1S/bjRBxgvX+4J2knNGLoIjB+s9H2J/VbbbZBm6NMG' +
					'Lq3u9IG9XBrA3sUlSOXb74znAIUQ9J7NwXgZ+mAyiQ8VIFpfs0Ds+L+k+k0C1DpG' +
					'QkXkvCxkwU8bQBpuvU5QePG86/BrfM5WEh6hPbqSLZdZuv99ZhY5lXKsuAExlRUc' +
					'yr3IGghXDba3YgvYK4YDIY/E5hO7zJQlkrILBTanz9uov8/Nwfwx2K3HKH9eR+GQ' +
					'MtnFBXANy/CXChXlprATUwwVYm95EbomEA0GqHTK7m2ABaJEozAtgfxVxGCaiNQ2' +
					'1YA2ueCdGiXJhsHBLrJwJ+uxQT4kNCpRp5yTSK460dopaD+xJdNt6kSUPsDR5vSi' +
					'XUslblbe+qRVJuz59PaEebDyFdeuTDmQ9OBxYFGH8AKU3r6ynZXFgAcKQRQg+UG1' +
					'SDYK8eTNe9ycP41Moo0dC6YrJNtY1xGqvAUCraW11QOk28qTxAbV2vbR8s2ZSTsO' +
					'VGYUKctZyA/bpTxcz/tlKx0TIt5OOwPSu+T/FOMNDASdKJ122/NaR21hyQ3wxBy2' +
					'f9awTTwKuvk9HTttj6Smbgo3Dvfuv6bXxJ2E7gBpeG2Gp3/buy9oSdGz55g3JnBl' +
					'k3g35gfvniyXMTUcYGykirGjObeWaR2u4sxQEacGQ0wer+DssYj0RdIXMVqpYJLW' +
					'8UoB46NVYqqFv5bkGr3XAAPaAAAAAElFTkSuQmCC';
				if ( (q.status!="Completed" || GM_getValue("showCompletedQuests")) && q.level<=Helper.characterLevel) {
					bgColor = ((c++)%2==0)?"#e2b960":"#e7c473";
					output+='<tr style="background-color:' + bgColor + '"><td>';
					if (q.href!=undefined) {
						output+= '<a href="' + q.href + '">' + q.questName + '</a>';
					} else {
						output+= q.questName;
					}
					var fsgQuestName = q.questName.replace(/  /g,"+");
					fsgQuestName = fsgQuestName.replace(/ /g,"+");
					var wikiQuestName = q.questName.replace(/  /g,"_");
					wikiQuestName = wikiQuestName.replace(/ /g,"_");
					output+=
						'</td><td><a href="http://www.fallenswordguide.com/quests/index.php?realm=0&search=' + fsgQuestName +
						'" target="_blank" title="Look up this quest on Fallen Sword Guide">f</a>' +
						'&nbsp<a href="http://wiki.fallensword.com/index.php/' + wikiQuestName +
						'" target="_blank" title="Look up this quest on the wiki">w</a>' +
						'</td><td align="right">' + q.level +
						'</td><td width="20"></td><td>' + q.location + '</td><td align="right"><img src="' + img + '"></td></tr>';
				}
			}
		}
		output+='</table>';
		return output;
	},

	injectAuctionSearch: function() {
		var content=Layout.notebookContent();
		content.innerHTML='<table cellspacing="0" cellpadding="0" border="0" width="100%">'+
			'<tr><td colspan="2" nobr bgcolor="#cd9e4b" align="center"><b>&nbsp;Auction Quick Search</b></td></tr>'+
			'<tr><td>This screen allows you to set up some quick search templates for the Auction House. '+
				'The Display on AH column indicates if the quick search will show on the short list on the '+
				'Auction House main screen. A maximum of 18 items can show on this list '+
				'(It will not show more than 18 even if you have more than 18 flagged). '+
				'To edit items, either use the large text area below, '+
				'or add a new entry and delete the old one. You can always reset the list to the default values.</td></tr>'+
			'</table>' +
			'<div style="font-size:small;" id="Helper:Auction Search Output">' +
			'</div>';
		var injectHere = document.getElementById('Helper:Auction Search Output');
		var quickSearchList = System.getValueJSON("quickSearchList");
		var currentCategory = "";
		var output = "<table  cellspacing='0' cellpadding='0' border='0' width='100%'><tbody>";
		output += "<tr bgcolor='#cd9e4b'><th></th><th>Nickname</th><th>Quick Search Text</th><th>Display on AH?</th><th>Delete?</th></tr>";
		for (j=0; j<quickSearchList.length; j++) {
			var quickSearchItem=quickSearchList[j];
			if (quickSearchItem) {
				if (currentCategory != quickSearchItem.category)
					output += "<tr><td colspan=5><span style='font-weight:bold; font-size:large;'>" + quickSearchItem.category + "</span></td></tr>";
				//http://www.fallensword.com/index.php?cmd=auctionhouse&type=-1&search_text=Potion of Truth&page=1&order_by=1
				output += "<tr><td width='10'></td>"+
					"<td><a href='" + System.server +
					"index.php?cmd=auctionhouse&type=-1&search_text=" +
					quickSearchItem.searchname + "&page=1&order_by=1' title='" +
					quickSearchItem.searchname + "'><span style='cursor:pointer; text-decoration:underline; color:blue;'>" +
					((quickSearchItem.nickname)? quickSearchItem.nickname:"") + "</span></a></td>" +
					"<td><a href='" + System.server +
					"index.php?cmd=auctionhouse&type=-1&search_text=" +
					quickSearchItem.searchname + "&page=1&order_by=1' title='" +
					quickSearchItem.searchname + "'><span style='cursor:pointer; text-decoration:underline; color:blue;'>" +
					quickSearchItem.searchname + "</span></a></td>" +
					"<td><span style='color:blue;'>"+(quickSearchItem.displayOnAH?"True":"False")+"</span></td>" +
					"<td>[<span style='cursor:pointer; text-decoration:underline; color:blue;' id='Helper:delAuctionSearch"+j+"' auctionSearchId="+j+">"+
						"del</span>]</td></tr>";
				currentCategory = quickSearchItem.category;
			}
		}
		output += "<tr><td colspan=5 height=10></td></tr>";
		output += "<tr><td colspan=5>"+
				"<table cellspacing='0' cellpadding='0' border='0' width='100%'><tbody>"+
				"<tr><th>Category</th><th>Nickname</th><th>Search Name</th><th>Display on AH?</th><th></th></tr>"+
				"<tr align='right'>"+
					"<td><input type='text' class='custominput' size='14' id='Helper:category'/></td>"+
					"<td><input type='text' class='custominput' size='8' id='Helper:nickname'/></td>"+
					"<td><input type='text' class='custominput' size='40' id='Helper:searchname'/></td>"+
					"<td align='center'><input type='checkbox' class='custominput' id='Helper:displayOnAH'/></td>"+
					"<td>[<span style='cursor:pointer; text-decoration:underline; color:blue;' id='Helper:addAuctionSearch'>"+
						"add</span>]</td>"+
				"</tr></tbody></table>"+
			"</td></tr>";
		output += "<tr><td colspan=5 align=center><textarea cols=70 rows=20 name='auctionsearch'>" + JSON.stringify(quickSearchList) + "</textarea></td></tr>";
		output += "<tr><td colspan=5 align=center><input id='Helper:saveauctionsearch' type='button' value='Save' class='custombutton'>"+
					"&nbsp;<input id='Helper:resetauctionsearch' type='button' value='Reset' class='custombutton'></td></tr>";
		output += "</tbody></table>";
		injectHere.innerHTML = output;
		for (j=0; j<quickSearchList.length; j++) {
			document.getElementById("Helper:delAuctionSearch"+j).addEventListener('click', Helper.delAuctionSearch, true);
		}
		document.getElementById("Helper:addAuctionSearch").addEventListener('click', Helper.addAuctionSearch, true);
		document.getElementById("Helper:saveauctionsearch").addEventListener('click', Helper.saveAuctionSearch, true);
		document.getElementById("Helper:resetauctionsearch").addEventListener('click', Helper.resetAuctionSearch, true);
	},

	addAuctionSearch: function(evt) {
		var nickname = document.getElementById("Helper:nickname").value;
		var searchname = document.getElementById("Helper:searchname").value;
		var category = document.getElementById("Helper:category").value;
		var displayOnAH = document.getElementById("Helper:displayOnAH").checked;
		if (!nickname || !searchname || !category) return;
		var quickSearchList = System.getValueJSON("quickSearchList");
		var theSearch = new Object;
		theSearch.nickname = nickname;
		theSearch.searchname = searchname;
		theSearch.category = category;
		theSearch.displayOnAH = displayOnAH;
		quickSearchList.push(theSearch);
		Helper.sortAsc=true;
		Helper.sortBy="category";
		quickSearchList.sort(Helper.stringSort);
		System.setValueJSON("quickSearchList", quickSearchList);
		window.location=window.location;
	},

	delAuctionSearch: function(evt) {
		var auctionSearchId = evt.target.getAttribute("auctionSearchId");
		var quickSearchList = System.getValueJSON("quickSearchList");
		quickSearchList.splice(auctionSearchId,1);
		Helper.sortAsc=true;
		Helper.sortBy="category";
		quickSearchList.sort(Helper.stringSort);
		System.setValueJSON("quickSearchList", quickSearchList);
		window.location = window.location;
	},

	saveAuctionSearch: function(evt) {
		auctionsearchtextarea = System.findNode("//textarea[@name='auctionsearch']");
		var quickSearchList = JSON.parse(auctionsearchtextarea.value);
		Helper.sortAsc=true;
		Helper.sortBy="category";
		quickSearchList.sort(Helper.stringSort);
		System.setValueJSON("quickSearchList", quickSearchList);
		window.location=window.location;
	},

	resetAuctionSearch: function(evt) {
		GM_setValue("quickSearchList","");
		window.location=window.location;
	},

	linkFromMouseover: function(mouseOver) {
		var reParams=/(\d+),\s*(\d+),\s*(\d+),\s*(\d+)/;
		var reResult=reParams.exec(mouseOver);
		var itemId=reResult[1];
		var invId=reResult[2];
		var type=reResult[3];
		var pid=reResult[4];
		var theUrl = "fetchitem.php?item_id=" + itemId + "&inv_id=" + invId + "&t="+type + "&p="+pid
		theUrl = System.server + theUrl;
		return theUrl
	},

	linkFromMouseoverCustom: function(mouseOver) {
		var reParams =/(\d+),\s*(-?\d+),\s*(\d+),\s*(\d+),\s*\'([a-z0-9]+)\'/i;
		var reResult =reParams.exec(mouseOver);
		var itemId   = reResult[1];
		var invId    = reResult[2];
		var type     = reResult[3];
		var pid      = reResult[4];
		var vcode    = reResult[5];
		var theUrl   = "fetchitem.php?item_id=" + itemId + "&inv_id=" + invId + "&t="+type + "&p=" + pid + "&vcode=" + vcode
		theUrl = System.server + theUrl;
		return theUrl
	},

	injectInventoryManager: function() {
		var content=Layout.notebookContent();

		var lastCheck=GM_getValue("lastInventoryCheck")
		var now=(new Date()).getTime();
		if (!lastCheck) lastCheck=0;
		var haveToCheck=((now - lastCheck) > 5*60*1000)
		if (haveToCheck) {
			var refreshButton = '<td width="10%" nobr style="font-size:x-small;text-align:right">[ <span id="Helper:InventoryManagerRefresh" style="text-decoration:underline;cursor:pointer">Refresh</span> ]</td>';
		} else {
			var refreshButton = '<td width="10%" nobr style="font-size:x-small;text-align:right">[ Wait '+ Math.round(300 - ((now - lastCheck)/1000)) +'s ]</td>';
		}

		Helper.inventory=System.getValueJSON("inventory");
		var newhtml='<table cellspacing="0" cellpadding="0" border="0" width="100%"><tr style="background-color:#cd9e4b">'+
			'<td width="90%" nobr><b>&nbsp;Inventory Manager</b> green = worn, blue = backpack</td>'+
			refreshButton+
			'<tr><td colspan=2>' +
			'<table><tr><td><b>Show Items:</b></td>' +
			'<td><table><tr><td>&nbsp;Only Useable:<input id="showUseableItems" type="checkbox" linkto="showUseableItems"' +
			(GM_getValue("showUseableItems")?' checked':'') + '/>';
		for (var i=0; i<Helper.itemFilters.length; i++) {
			newhtml += (i % 5 ==0) ? '</td></tr><tr><td>' : '';
			newhtml+='&nbsp;' +Helper.itemFilters[i].type+ 's:<input id="'+Helper.itemFilters[i].id+'" type="checkbox" linkto="'+Helper.itemFilters[i].id+'"' +
					(GM_getValue(Helper.itemFilters[i].id)?' checked':'') + '/>';
		}
		newhtml+='</td></tr><tr><td>&nbsp;<span id=GuildInventorySelectAll>[Select All]</span>&nbsp;<span id=GuildInventorySelectNone>[Select None]</span>' +
				'</td></tr></table></td></tr></table>' +
				'<div style="font-size:small;" id="Helper:InventoryManagerOutput">' +
				'</div>';
		content.innerHTML=newhtml;
		if (haveToCheck)
			document.getElementById("Helper:InventoryManagerRefresh").addEventListener('click', Helper.parseProfileStart, true);
		Helper.generateInventoryTable("self");
		document.getElementById("showUseableItems").addEventListener('click', Helper.toggleCheckboxAndRefresh, true);
		for (var i=0; i<Helper.itemFilters.length; i++) {
			document.getElementById(Helper.itemFilters[i].id).addEventListener('click', Helper.toggleCheckboxAndRefresh, true);
		}
		document.getElementById("GuildInventorySelectAll").addEventListener('click', Helper.InventorySelectFilters, true);
		document.getElementById("GuildInventorySelectNone").addEventListener('click', Helper.InventorySelectFilters, true);
	},

	injectGuildInventoryManager: function() {
		var content=Layout.notebookContent();

		var lastCheck=GM_getValue("lastGuildInventoryCheck")
		var now=(new Date()).getTime();
		if (!lastCheck) lastCheck=0;
		var haveToCheck=((now - lastCheck) > 15*60*1000)
		if (haveToCheck) {
			var refreshButton = '<td width="10%" nobr style="font-size:x-small;text-align:right">[ <span id="Helper:GuildInventoryManagerRefresh" style="text-decoration:underline;cursor:pointer">Refresh</span> ]</td>';
		} else {
			var refreshButton = '<td width="10%" nobr style="font-size:x-small;text-align:right">[ Wait '+ Math.round(900 - ((now - lastCheck)/1000)) +'s ]</td>';
		}

		var guildItemCount = "unknown"
		unsafeWindow.changeMenu(0,'menu_character');
		unsafeWindow.changeMenu(5,'menu_guild');
		unsafeWindow.changeMenu(0,'menu_character');
		// I don't know why changeMenu(0) needs to be called twice, but it seems it does...
		Helper.guildinventory = System.getValueJSON("guildinventory");
		if (Helper.guildinventory) {
			Helper.guildinventory.items = Helper.guildinventory.items.filter(function (e) {return (e.name)});
			guildItemCount = Helper.guildinventory.items.length;
		}
		
		var newhtml='<table cellspacing="0" cellpadding="0" border="0" width="100%"><tr style="background-color:#cd9e4b">'+
			'<td width="90%" nobr><b>&nbsp;Faction Inventory Manager</b> (takes a while to refresh so only do it if you really need to)</td>'+
			refreshButton+
			'</tr>' +
			'<tr><td colspan=2>' +
				'<table><tr><td><b>Show Items:</b></td>' +
				'<td><table><tr><td>&nbsp;Only Useable:<input id="showUseableItems" type="checkbox" linkto="showUseableItems"' +
				(GM_getValue("showUseableItems")?' checked':'') + '/>';
		for (var i=0; i<Helper.itemFilters.length; i++) {
			newhtml += (i % 5 ==0) ? '</td></tr><tr><td>' : '';
			newhtml+='&nbsp;' +Helper.itemFilters[i].type+ 's:<input id="'+Helper.itemFilters[i].id+'" type="checkbox" linkto="'+Helper.itemFilters[i].id+'"' +
					(GM_getValue(Helper.itemFilters[i].id)?' checked':'') + '/>';
		}
		newhtml+='</td></tr><tr><td>&nbsp;<span id=GuildInventorySelectAll>[Select All]</span>&nbsp;<span id=GuildInventorySelectNone>[Select None]</span>' +
				'</td></tr></table></td></tr>'+
			'<tr><td colspan=2>&nbsp;Faction Item Count:&nbsp;' + guildItemCount + '</td></tr></table>' +
			'<div style="font-size:small;" id="Helper:GuildInventoryManagerOutput">' +
			'</div>';
		content.innerHTML=newhtml;
		if (haveToCheck) 
			document.getElementById("Helper:GuildInventoryManagerRefresh").addEventListener('click', Helper.parseGuildStart, true);
		Helper.generateInventoryTable("guild");
		document.getElementById("showUseableItems").addEventListener('click', Helper.toggleCheckboxAndRefresh, true);
		for (var i=0; i<Helper.itemFilters.length; i++) {
			document.getElementById(Helper.itemFilters[i].id).addEventListener('click', Helper.toggleCheckboxAndRefresh, true);
		}
		document.getElementById("GuildInventorySelectAll").addEventListener('click', Helper.InventorySelectFilters, true);
		document.getElementById("GuildInventorySelectNone").addEventListener('click', Helper.InventorySelectFilters, true);
	},
	
	InventorySelectFilters: function(evt) {
		var checkedValue = (evt.target.id=="GuildInventorySelectAll");
		for (var i=0; i<Helper.itemFilters.length; i++) {
			GM_setValue(Helper.itemFilters[i].id, checkedValue);
		}
		if (checkedValue)
			window.location=window.location;
		else
			for (var i=0; i<Helper.itemFilters.length; i++) {
				document.getElementById(Helper.itemFilters[i].id).checked = checkedValue;
			}
	},
	
	toggleCheckboxAndRefresh: function(evt) {
		GM_setValue(evt.target.id, evt.target.checked);
		window.location=window.location;
	},

	injectOnlinePlayers: function() {
		var content=Layout.notebookContent();
		unsafeWindow.changeMenu(0,'menu_character');
		unsafeWindow.changeMenu(2,'menu_actions');
		unsafeWindow.changeMenu(0,'menu_character');

		var lastCheck=GM_getValue("lastOnlineCheck")
		var now=(new Date()).getTime();
		if (!lastCheck) lastCheck=0;
		var haveToCheck=((now - lastCheck) > 5*60*1000)
		if (haveToCheck) {
			var refreshButton = '<td> (takes a while to refresh so only do it if you really need to) </td>'+
			'<td width="10%" nobr style="font-size:x-small;text-align:right"><span id="Helper:OnlinePlayersRefresh" style="text-decoration:underline;cursor:pointer">[Refresh]</span></td>';
		} else {
			var refreshButton = '<td width="10%" nobr style="font-size:x-small;text-align:right">[ Wait '+ Math.round(300 - ((now - lastCheck)/1000)) +'s ]</td>';
		}

		content.innerHTML='<table cellspacing="0" cellpadding="0" border="0" width="100%"><tr style="background-color:#cd9e4b">'+
			'<td nobr><b>&nbsp;Online Players</b></td>' +
			refreshButton +
			'</tr>' +
			'</table>' +
			'<div style="font-size:small;" id="Helper:OnlinePlayersOutput">' +
			'' +
			'</div>';
		var refreshButton = document.getElementById("Helper:OnlinePlayersRefresh");
		if (refreshButton)
			refreshButton.addEventListener('click', Helper.parseOnlinePlayersStart, true);

		GM_addStyle(
			'.HelperTableRow1 {background-color:#e7c473;font-size:small}\n' +
			'.HelperTableRow1:hover {background-color:white}\n' +
			'.HelperTableRow2 {background-color:#e2b960;font-size:small}\n' +
			'.HelperTableRow2:hover {background-color:white}');
		Helper.onlinePlayers = System.getValueJSON("onlinePlayers");
		Helper.sortOnlinePlayersTable();
		Helper.generateOnlinePlayersTable();
	},

	parseOnlinePlayersStart: function() {

		// set timer to redisplay the [refresh] button
		var now=(new Date()).getTime();
		GM_setValue("lastOnlineCheck", now.toString());

		var refreshButton = document.getElementById("Helper:OnlinePlayersRefresh");
		refreshButton.style.visibility = "hidden";

		Helper.onlinePlayers = {players:[]};
		var output=document.getElementById('Helper:OnlinePlayersOutput')
		output.innerHTML='<br/>Parsing online players ...';
		System.xmlhttp('index.php?cmd=onlineplayers&page=1', Helper.parseOnlinePlayersStorePage, {"page":1});
	},

	parseOnlinePlayersStorePage: function(responseText, callback) {
		var doc = System.createDocument(responseText);
		var output=document.getElementById('Helper:OnlinePlayersOutput')
		var playerRows = System.findNodes("//table[@width='400']/tbody/tr[count(td)=4 and td[2]/a]", doc);
		var maxPage = parseInt(System.findNode("//table[@width='400']//td[input]", doc).textContent.replace(/\D/g, ""));
		output.innerHTML+=callback.page + " ";
		if (playerRows)
			for (var i=0; i<playerRows.length; i++) {
				var guildId;
				if (playerRows[i].cells[0].innerHTML.search("href") == -1) guildId = -1;
				else guildId = parseInt(playerRows[i].cells[0].firstChild.href.replace(/\D/g,""));
				var newPlayer = {
					guildId: guildId,
					id: parseInt(playerRows[i].cells[1].firstChild.href.replace(/\D/g,"")),
					name: playerRows[i].cells[1].textContent,
					level: parseInt(playerRows[i].cells[2].textContent)
				}
				Helper.onlinePlayers.players.push(newPlayer);
			}
		if (callback.page<maxPage/*-maxPage+15*/) {
			var newPage = (callback.page == 1) ? Math.round(4 * maxPage / 5) : (callback.page+1);
			System.xmlhttp('index.php?cmd=onlineplayers&page=' + newPage, Helper.parseOnlinePlayersStorePage, {"page":newPage});
		}
		else {
			System.setValueJSON("onlinePlayers", Helper.onlinePlayers);
			Helper.sortOnlinePlayersTable();
			Helper.generateOnlinePlayersTable();
		}
	},

	generateOnlinePlayersTable: function() {
		if (!Helper.onlinePlayers) return;
		var minLvl = GM_getValue("onlinePlayerMinLvl", 1);
		var maxLvl = GM_getValue("onlinePlayerMaxLvl", 1000);
		var output=document.getElementById("Helper:OnlinePlayersOutput");
		var result=
			'<div align=right><form id=Helper:onlinePlayerFilterForm>' +
			'Min lvl:<input value="' + minLvl + '" size=5 name="Helper.onlinePlayerMinLvl" id="Helper.onlinePlayerMinLvl" style=custominput/> ' +
			'Max lvl:<input value="' + maxLvl + '" size=5 name="Helper.onlinePlayerMaxLvl" id="Helper.onlinePlayerMaxLvl" style=custominput/> ' +
			'<input id="Helper:onlinePlayerFilter" class="custombutton" type="submit" value="Filter"/>' +
			'<input id="Helper:onlinePlayerFilterReset" class="custombutton" type="button" value="Reset"/></form></div>' +
			'<table id="Helper:OnlinePlayersTable"><tr>' +
			'<th align="left" sortkey="guildId" sortType="number">Guild</th>' +
			'<th sortkey="name">Name</th>' +
			'<th sortkey="level" sortType="number">Level</th></tr>';
		var player, color;
		for (var i=0; i<Helper.onlinePlayers.players.length;i++) {
			player=Helper.onlinePlayers.players[i];
			if (player.level >= minLvl && player.level <= maxLvl)
				result+='<tr class="HelperTableRow' + (1 + i % 2) +'">' +
					'<td><a href="index.php?cmd=guild&amp;subcmd=view&amp;guild_id=' + player.guildId + '">'+
						'<img width="16" border="0" height="16" src="' + System.imageServer + '/guilds/' + player.guildId + '_mini.jpg"></a></td>'+
					'<td><a href="index.php?cmd=profile&player_id='+player.id+'">'+ player.name+'</a></td>' +
					'<td align="right">' + player.level + '</td>' +
					'</tr>';
		}
		result+='</table>';
		output.innerHTML=result;

		// document.getElementById("Helper:onlinePlayerFilter").addEventListener('click', Helper.setOnlinePlayerFilter, true);
		document.getElementById("Helper:onlinePlayerFilterReset").addEventListener('click', Helper.resetOnlinePlayerFilter, true);
		document.getElementById("Helper:onlinePlayerFilterForm").addEventListener('submit', Helper.setOnlinePlayerFilter, true);

		var theTable=document.getElementById('Helper:OnlinePlayersTable');
		for (var i=0; i<theTable.rows[0].cells.length; i++) {
			var cell=theTable.rows[0].cells[i];
			cell.style.textDecoration="underline";
			cell.style.cursor="pointer";
			cell.addEventListener('click', Helper.sortOnlinePlayersTable, true);
		}
	},

	setOnlinePlayerFilter: function() {
		var onlinePlayerMinLvl = document.getElementById("Helper.onlinePlayerMinLvl");
		var onlinePlayerMaxLvl = document.getElementById("Helper.onlinePlayerMaxLvl");
		if (onlinePlayerMinLvl.value == '') onlinePlayerMinLvl.value = '0';
		if (onlinePlayerMaxLvl.value == '') onlinePlayerMaxLvl.value = '1000';
		if (!isNaN(onlinePlayerMinLvl.value))
			GM_setValue("onlinePlayerMinLvl", parseInt(onlinePlayerMinLvl.value));
		if (!isNaN(onlinePlayerMaxLvl.value))
			GM_setValue("onlinePlayerMaxLvl", parseInt(onlinePlayerMaxLvl.value));
		Helper.generateOnlinePlayersTable();
	},

	resetOnlinePlayerFilter: function() {
		GM_setValue("onlinePlayerMinLvl", 1);
		GM_setValue("onlinePlayerMaxLvl", 1000);
		Helper.generateOnlinePlayersTable();
	},

	sortOnlinePlayersTable: function(evt) {
		Helper.onlinePlayers=System.getValueJSON("onlinePlayers");
		if (!evt) {
			var sortCriteria = System.getValueJSON("onlinePlayerSortBy");
			if (!sortCriteria) return;
			var sortType = sortCriteria["sortType"];
			Helper.sortBy = sortCriteria["sortBy"];
			Helper.sortAsc = sortCriteria["sortAsc"];
		} else {
			var headerClicked = evt.target.getAttribute("sortKey");
			var sortType = evt.target.getAttribute("sortType");
			if (!sortType) sortType="string";
			GM_log(headerClicked);
			// GM_log(Helper.sortBy);
			GM_log(sortType);
			// numberSort
			if (Helper.sortAsc==undefined) Helper.sortAsc=true;
			if (Helper.sortBy && Helper.sortBy==headerClicked) {
				Helper.sortAsc=!Helper.sortAsc;
			}
			Helper.sortBy=headerClicked;
		}
		System.setValueJSON("onlinePlayerSortBy", {"sortBy": Helper.sortBy, "sortType": sortType, "sortAsc": Helper.sortAsc});

		switch(sortType) {
			case "string":
				Helper.onlinePlayers.players.sort(Helper.stringSort);
				break;
			case "number":
				Helper.onlinePlayers.players.sort(Helper.numberSort);
				break;
		}
		Helper.generateOnlinePlayersTable();
	},

	toggleCheckboxAndRefresh: function(evt) {
		GM_setValue(evt.target.id, evt.target.checked);
		window.location=window.location;
	},

	parseProfileStart: function(){
		var now=(new Date()).getTime();
		GM_setValue("lastInventoryCheck", now.toString());

		Helper.inventory = new Object;
		Helper.inventory.items = new Array();
		var output=document.getElementById('Helper:InventoryManagerOutput')
		output.innerHTML='<br/>Parsing profile...';
		Data.itemList();
		System.xmlhttp('index.php?cmd=profile', Helper.parseProfileDone)
	},

	parseProfileDone: function(responseText) {
		var doc=System.createDocument(responseText);
		var output=document.getElementById('Helper:InventoryManagerOutput');
		var currentlyWorn=System.findNodes("//a[contains(@href,'subcmd=unequipitem') and contains(img/@src,'/items/')]/img", doc);
		for (var i=0; i<currentlyWorn.length; i++) {
			var item={"url": Helper.linkFromMouseover(currentlyWorn[i].getAttribute("onmouseover")),
				"where":"worn", "index":(i+1),
				"onmouseover":currentlyWorn[i].getAttribute("onmouseover")};
			if (i==0) output.innerHTML+="<br/>Found worn item "
			output.innerHTML+=(i+1) + " ";
			Helper.inventory.items.push(item);
		}
		var	folderIDs = new Array();
		Helper.folderIDs = folderIDs; //clear out the array before starting.
		GM_setValue("currentFolder", 1);
		var folderLinks = System.findNodes("//a[contains(@href,'index.php?cmd=profile&folder_id=')]", doc);
		//if folders are enabled then save the ID's in an array
		if (folderLinks) {
			for (var i=0; i<folderLinks.length;i++) {
				folderLink = folderLinks[i];
				href = folderLink.getAttribute("href")
				var folderID = /folder_id=([-0-9]+)/.exec(href)[1]*1;
				folderIDs.push(folderID);
				Helper.folderIDs = folderIDs;
			}
		}
		Helper.parseInventoryPage(responseText);
	},

	parseInventoryPage: function(responseText) {
		var doc=System.createDocument(responseText);
		var output=document.getElementById('Helper:InventoryManagerOutput');
		var backpackItems = System.findNodes("//td[contains(@background,'2x3.gif')]/center/a[contains(@href, 'subcmd=equipitem')]/img", doc);
		var pages = System.findNodes("//a[contains(@href,'index.php?cmd=profile&backpack_page=')]", doc);
		var pageElement = System.findNode("//a[contains(@href,'backpack_page=')]/font", doc);
		var currentPage = 1;
		if (pageElement) currentPage = parseInt(System.findNode("//a[contains(@href,'backpack_page=')]/font", doc).textContent);
		var currentFolder = GM_getValue("currentFolder");
		var folderCount = 0, folderID = -1;
		if (Helper.folderIDs.length<=1) {
			folderCount = 1;
			folderID = -1;
		} else {
			folderCount = Helper.folderIDs.length;
			folderID = Helper.folderIDs[currentFolder-1];
		}
		if (backpackItems) {
			output.innerHTML+='<br/>Parsing folder '+currentFolder+', backpack page '+currentPage+'...';

			for (var i=0; i<backpackItems.length;i++) {
				var theUrl=Helper.linkFromMouseover(backpackItems[i].getAttribute("onmouseover"))
				var item={"url": theUrl,
					"where":"backpack", "index":(i+1), "page":currentPage,
					"onmouseover":backpackItems[i].getAttribute("onmouseover")};
				if (i==0) output.innerHTML+="<br/>Found wearable item "
				output.innerHTML+=(i+1) + " ";
				Helper.inventory.items.push(item);
			}
			} else {
				output.innerHTML+='<br/>Parsing folder '+currentFolder+', backpack page '+currentPage+'... Empty';
			}
		if (currentPage<pages.length || currentFolder<folderCount) {
			if (currentPage==pages.length && currentFolder<folderCount) {
				currentPage = 0;
				folderID = Helper.folderIDs[currentFolder];
				GM_setValue("currentFolder", currentFolder+1);
			}
			System.xmlhttp('index.php?cmd=profile&backpack_page='+(currentPage)+'&folder_id='+(folderID), Helper.parseInventoryPage);
		}
		else {
			output.innerHTML+="<br/>Parsing inventory item "
			Helper.retrieveInventoryItem(0, "self");
		}
	},

	parseGuildStart: function(){
		var now=(new Date()).getTime();
		GM_setValue("lastGuildInventoryCheck", now.toString());

		Helper.guildinventory = new Object;
		Helper.guildinventory.items = new Array();
		var output=document.getElementById('Helper:GuildInventoryManagerOutput')
		output.innerHTML = '<br/>Parsing guild store ...';
		Data.itemList();
		System.xmlhttp('index.php?cmd=guild&subcmd=manage&guildstore_page=0', Helper.parseGuildStorePage);
	},

	parseGuildStorePage: function(responseText) {
		var doc=System.createDocument(responseText);
		var output=document.getElementById('Helper:GuildInventoryManagerOutput');
		var guildstoreItems = System.findNodes("//a[contains(@href,'subcmd2=takeitem')]/img", doc);
		var pages = System.findNodes("//a[contains(@href,'cmd=guild&subcmd=manage&guildstore_page')]", doc);
		var currentPage = parseInt(System.findNode("//a[contains(@href,'cmd=guild&subcmd=manage&guildstore_page')]/font", doc).textContent);
		if (guildstoreItems) {
			output.innerHTML+='<br/>Parsing guild store page '+currentPage+'...';

			for (var i=0; i<guildstoreItems.length;i++) {
				var theUrl=Helper.linkFromMouseover(guildstoreItems[i].getAttribute("onmouseover"))
				var item={"url": theUrl,
					"where":"guildstore", "index":(i+1), "page":currentPage, "worn":false,
					"onmouseover":guildstoreItems[i].getAttribute("onmouseover")};
				if (i==0) output.innerHTML+="<br/>Found guild store item "
				output.innerHTML+=(i+1) + " ";
				Helper.guildinventory.items.push(item);
			}
		} else {
			output.innerHTML+='<br/>Parsing guild store page '+currentPage+'... Empty';
		}
		if (currentPage<pages.length) {
			System.xmlhttp('index.php?cmd=guild&subcmd=manage&guildstore_page='+(currentPage), Helper.parseGuildStorePage);
		}
		else {
			output.innerHTML+='<br/>Parsing guild report page ...';
			System.xmlhttp('index.php?cmd=guild&subcmd=inventory&subcmd2=report', Helper.parseGuildReportPage)
		}
	},

	parseGuildReportPage: function(responseText) {
		var doc=System.createDocument(responseText);
		var output=document.getElementById('Helper:GuildInventoryManagerOutput');
		var guildreportItems = System.findNodes("//img[contains(@src,'items')]", doc);
		if (guildreportItems) {
			for (var i=0; i<guildreportItems.length;i++) {
				var theUrl=Helper.linkFromMouseover(guildreportItems[i].getAttribute("onmouseover"))
				var item={"url": theUrl,
					"where":"guildreport", "index":(i+1), "worn":false,
					"onmouseover":guildreportItems[i].getAttribute("onmouseover")};
				if (i==0) output.innerHTML+="<br/>Found guild report item "
				output.innerHTML+=(i+1) + " ";
				Helper.guildinventory.items.push(item);
			}
		}
		output.innerHTML+="<br/>Parsing guild inventory item "
		Helper.retrieveInventoryItem(0, "guild");
	},

	retrieveInventoryItem: function(invIndex, reportType) {
		if (reportType == "guild") {
			targetInventory = Helper.guildinventory;
		} else {
			targetInventory = Helper.inventory;
		}
		System.xmlhttp(targetInventory.items[invIndex].url, Helper.parseInventoryItem, {"invIndex": invIndex, "reportType": reportType});
	},

	parseInventoryItem: function(responseText, callback) {
		if (callback.reportType == "guild") {
			targetId = 'Helper:GuildInventoryManagerOutput';
			targetInventory = Helper.guildinventory;
		} else {
			targetId = 'Helper:InventoryManagerOutput';
			targetInventory = Helper.inventory;
		}
		var output=document.getElementById(targetId);
		var doc=System.createDocument(responseText);
		output.innerHTML+=(callback.invIndex+1) + " ";

		var item=targetInventory.items[callback.invIndex];
		// item.html=responseText;

		var nameNode=System.findNode("//b", doc);
		if (!nameNode) GM_log(responseText);
		if (nameNode) {
			item.name=nameNode.textContent.replace(/\\/g,"");

			var itemBonuses=System.findNode("//table[tbody/tr/td/center/font='Bonuses']", doc);

			var attackNode=System.findNode("tbody/tr/td[.='Attack:']/../td[2]", itemBonuses);
			item.attack=(attackNode)?parseInt(attackNode.textContent):0;

			var defenseNode=System.findNode("tbody/tr/td[.='Defense:']/../td[2]", itemBonuses);
			item.defense=(defenseNode)?parseInt(defenseNode.textContent):0;

			var armorNode=System.findNode("tbody/tr/td[.='Armor:']/../td[2]", itemBonuses);
			item.armor=(armorNode)?parseInt(armorNode.textContent):0;

			var damageNode=System.findNode("tbody/tr/td[.='Damage:']/../td[2]", itemBonuses);
			item.damage=(damageNode)?parseInt(damageNode.textContent):0;

			var hpNode=System.findNode("tbody/tr/td[.='HP:']/../td[2]", itemBonuses);
			item.hp=(hpNode)?parseInt(hpNode.textContent):0;

			var levelNode=System.findNode("//tr[td='Min Level:']/td[2]", doc);
			item.minLevel=(levelNode)?parseInt(levelNode.textContent):0;

			var forgeCount=0, re=/hellforge\/forgelevel.gif/ig;
			while(re.exec(responseText)) {
				forgeCount++;
			}
			item.forgelevel=forgeCount;

			var findItem = Data.itemArray.filter(function (e,i,a) {return e.name.trim()==item.name.trim()});
			if (findItem.length>0) {
				item.type = findItem[0].type;
			} else {
				GM_log("Item not found in list: '" + item.name + "'");
				item.type = "???"
			};

			var craft="";
			if (responseText.search(/Uncrafted|Very Poor|Poor|Average|Good|Very Good|Excellent|Perfect/) != -1){
				var fontLineRE=/<\/b><\/font><br>([^<]+)<font color='(#[0-9A-F]{6})'>([^<]+)<\/font>/
				var fontLineRX=fontLineRE.exec(responseText)
				craft = fontLineRX[3];
			}
			item.craftlevel=craft;
		}

		if (callback.invIndex<targetInventory.items.length-1) {
			Helper.retrieveInventoryItem(callback.invIndex+1, callback.reportType);
		}
		else {
			output.innerHTML+="Parsing done!";
			Helper.generateInventoryTable(callback.reportType);
		}
	},

	generateInventoryTable: function(reportType) {
		if (reportType == "guild") {
			targetId = 'Helper:GuildInventoryManagerOutput';
			targetInventory = Helper.guildinventory;
			inventoryShell = 'guildinventory';
		} else {
			targetId = 'Helper:InventoryManagerOutput';
			targetInventory = Helper.inventory;
			inventoryShell = 'inventory';
		}
		if (!targetInventory) return;
		targetInventory.items = targetInventory.items.filter(function (e) {return (e.name)});

		var output=document.getElementById(targetId);
		var result='<table id="Helper:InventoryTable"><tr>' +
			'<th width="180" align="left" sortkey="name" colspan="2">Name</th>' +
			'<th sortkey="minLevel">Level</th>' +
			'<th sortkey="where">Where</th>' +
			'<th sortkey="type">Type</th>' +
			'<th sortkey="attack">Att</th>' +
			'<th sortkey="defense">Def</th>' +
			'<th sortkey="armor">Arm</th>' +
			'<th sortkey="damage">Dam</th>' +
			'<th sortkey="hp">HP</th>' +
			'<th sortkey="forgelevel" colspan="2">Forge</th>' +
			'<th sortkey="craftlevel">Craft</th>' +
			'<th width="10"></th>';
		var item, color;
		var showUseableItems = GM_getValue("showUseableItems");
		var allItems = targetInventory.items;
		if (showUseableItems) {
			allItems=allItems.filter(function(e,i,a) {return e.minLevel <= Helper.characterLevel});
			//  && e.minLevel + 50 > Helper.characterLevel}
		}
		var showGloveTypeItems = GM_getValue("showGloveTypeItems");
		if (!showGloveTypeItems) {
			allItems=allItems.filter(function(e,i,a) {return e.type != 'gloves'});
		}
		var showHelmetTypeItems = GM_getValue("showHelmetTypeItems");
		if (!showHelmetTypeItems) {
			allItems=allItems.filter(function(e,i,a) {return e.type != 'helmet'});
		}
		var showAmuletTypeItems = GM_getValue("showAmuletTypeItems");
		if (!showAmuletTypeItems) {
			allItems=allItems.filter(function(e,i,a) {return e.type != 'amulet'});
		}
		var showWeaponTypeItems = GM_getValue("showWeaponTypeItems");
		if (!showWeaponTypeItems) {
			allItems=allItems.filter(function(e,i,a) {return e.type != 'weapon'});
		}
		var showAmorTypeItems = GM_getValue("showAmorTypeItems");
		if (!showAmorTypeItems) {
			allItems=allItems.filter(function(e,i,a) {return e.type != 'armor'});
		}
		var showShieldTypeItems = GM_getValue("showShieldTypeItems");
		if (!showShieldTypeItems) {
			allItems=allItems.filter(function(e,i,a) {return e.type != 'shield'});
		}
		var showRingTypeItems = GM_getValue("showRingTypeItems");
		if (!showRingTypeItems) {
			allItems=allItems.filter(function(e,i,a) {return e.type != 'ring'});
		}
		var showBootTypeItems = GM_getValue("showBootTypeItems");
		if (!showBootTypeItems) {
			allItems=allItems.filter(function(e,i,a) {return e.type != 'boots'});
		}
		var showRuneTypeItems = GM_getValue("showRuneTypeItems");
		if (!showRuneTypeItems) {
			allItems=allItems.filter(function(e,i,a) {return e.type != 'rune'});
		}

		for (var i=0; i<allItems.length;i++) {
			item=allItems[i];

			switch (item.where+"") {
				case "worn":        color = "green";  whereText = "Worn"; whereTitle="Wearing it";     break;
				case "backpack":    color = "blue";   whereText = "BP";   whereTitle="In Backpack";    break;
				case "guildstore":  color = "navy";   whereText = "GS";   whereTitle="Guild Store";  break;
				case "guildreport": color = "maroon"; whereText = "Rep";  whereTitle="Guild Report"; break;
				default: color = "black";
			}

			result+='<tr style="color:'+ color +'">' +
				'<td>' + '<img src="' + System.imageServer + '/temple/1.gif" onmouseover="' + item.onmouseover + '">' +
				'</td><td>' + item.name + '</td>' +
				'<td align="right">' + item.minLevel + '</td>' +
				'<td align="right" title="' + whereTitle + '">' + whereText + '</td>' +
				'<td align="right">' + item.type + '</td>' +
				'<td align="right">' + item.attack + '</td>' +
				'<td align="right">' + item.defense + '</td>' +
				'<td align="right">' + item.armor + '</td>' +
				'<td align="right">' + item.damage + '</td>' +
				'<td align="right">' + item.hp + '</td>' +
				'<td align="right">' + item.forgelevel + '</td>' +
				'<td>' + ((item.forgelevel>0)? "<img src='" + System.imageServer + "/hellforge/forgelevel.gif'>":"") + '</td>' +
					'<td align="right">' + item.craftlevel + '</td>' +
				'<td></td>' +
				'</tr>';
		}
		result+='</table>';
		output.innerHTML=result;

		targetInventory.lastUpdate = new Date();
		System.setValueJSON(inventoryShell, targetInventory);

		var inventoryTable=document.getElementById('Helper:InventoryTable');
		for (var i=0; i<inventoryTable.rows[0].cells.length; i++) {
			var cell=inventoryTable.rows[0].cells[i];
			cell.style.textDecoration="underline";
			cell.style.cursor="pointer";
			cell.addEventListener('click', Helper.sortInventoryTable, true);
		}
	},

	sortInventoryTable: function(evt) {
		re=/subcmd=([a-z]+)/;
		var subPageIdRE = re.exec(document.location.search);
		var subPageId="-";
		if (subPageIdRE)
			subPageId=subPageIdRE[1];
		if (subPageId == "guildinvmanager") {
			Helper.guildinventory=System.getValueJSON("guildinventory");
			targetInventory = Helper.guildinventory;
		} else {
			Helper.inventory=System.getValueJSON("inventory");
			targetInventory = Helper.inventory;
		}
		var headerClicked=evt.target.getAttribute("sortKey")
		if (Helper.sortAsc==undefined) Helper.sortAsc=true;
		if (Helper.sortBy && Helper.sortBy==headerClicked) {
			Helper.sortAsc=!Helper.sortAsc;
		}
		Helper.sortBy="name";
		targetInventory.items.sort(Helper.stringSort);

		Helper.sortBy=headerClicked;
		//GM_log(headerClicked)
		if (headerClicked=="minLevel" || headerClicked=="attack" || headerClicked=="defense" ||
			headerClicked=="armor" || headerClicked=="damage" || headerClicked=="forgelevel" ||
			headerClicked=="hp") {
			targetInventory.items.sort(Helper.numberSort)
		}
		else {
			targetInventory.items.sort(Helper.stringSort)
		}
		if (subPageId == "guildinvmanager") {
			Helper.generateInventoryTable("guild");
		} else {
			Helper.generateInventoryTable("self");
		}
	},

	injectRecipeManager: function() {
		var content=Layout.notebookContent();
		Helper.recipebook = System.getValueJSON("recipebook");
		content.innerHTML='<table cellspacing="0" cellpadding="0" border="0" width="100%"><tr style="background-color:#cd9e4b">'+
			'<td width="90%" nobr><b>&nbsp;Recipe Manager</b></td>'+
			'<td width="10%" nobr style="font-size:x-small;text-align:right">[<span id="Helper:RecipeManagerRefresh" style="text-decoration:underline;cursor:pointer">Refresh</span>]</td>'+
			'</tr>' +
			'</table>' +
			'<div style="font-size:small;" id="Helper:RecipeManagerOutput">' +
			'' +
			'</div>';
		if (!Helper.recipebook) Helper.parseInventingStart();
		document.getElementById("Helper:RecipeManagerRefresh").addEventListener('click', Helper.parseInventingStart, true);
		Helper.generateRecipeTable();
	},

	parseInventingStart: function(){
		Helper.recipebook = {};
		Helper.recipebook.recipe = [];
		var output=document.getElementById('Helper:RecipeManagerOutput')
		output.innerHTML='<br/>Parsing inventing screen ...<br/>';
		System.xmlhttp('index.php?cmd=inventing&page=0', Helper.parseInventingPage, {"page": 0});
	},

	parseInventingPage: function(responseText, callback) {
		var doc=System.createDocument(responseText);
		var output=document.getElementById('Helper:RecipeManagerOutput');
		var currentPage = callback.page;
		var pages=System.findNode("//select[@name='page']", doc);
		if (!pages) return;
		var recipeRows = System.findNodes("//table[tbody/tr/td[.='Recipe Name']]//tr[td/img]",doc);

		output.innerHTML += 'Page ' + currentPage + '...<br/>';

		if (recipeRows) {
			for (var i=0; i<recipeRows.length;i++) {
				aRow = recipeRows[i];
				var recipeLink = aRow.cells[1].firstChild.href;
				var recipeId = parseInt(recipeLink.match(/recipe_id=(\d+)/i)[1]);
				var recipe={
					"img": aRow.cells[0].firstChild.src,
					"link": recipeLink,
					"name": aRow.cells[1].firstChild.textContent,
					"id": recipeId};
				output.innerHTML+="Found blueprint: "+ recipe.name + "<br/>";
				Helper.recipebook.recipe.push(recipe);
			}
		}

		var nextPage=currentPage+1; //pages[currentPage];
		if (nextPage<pages.options.length) {
			System.xmlhttp('index.php?cmd=inventing&page='+nextPage, Helper.parseInventingPage, {"page": nextPage});
		}
		else {
			output.innerHTML+='Finished parsing ... Retrieving individual blueprints...<br/>';
			// Helper.generateRecipeTable();
			System.xmlhttp('index.php?cmd=inventing&subcmd=viewrecipe&recipe_id=' + Helper.recipebook.recipe[0].id, Helper.parseRecipePage, {"recipeIndex": 0});
		}
	},

	parseRecipeItemOrComponent: function(xpath, doc) {
		var resultNodes = System.findNodes(xpath, doc);
		var results = [];
		if (resultNodes) {
			for (var i=0; i<resultNodes.length; i++) {
				var resultNode = resultNodes[i];
				var mouseOver = resultNode.firstChild.firstChild.getAttribute("onmouseover");
				var resultAmounts = resultNode.parentNode.nextSibling.textContent;
				var mouseOverRX = mouseOver.match(/ajaxLoadCustom\((\d+),\s*-1,\s*2,\s*\d+,\s*\'([a-z0-9]+)\',\s*\'\'\)/i);
				var result = {
					img: resultNode.firstChild.firstChild.src,
					id: mouseOverRX[1],
					verify: mouseOverRX[2],
					amountPresent: parseInt(resultAmounts.split("/")[0]),
					amountNeeded: parseInt(resultAmounts.split("/")[1])
				}
				results.push(result);
			}
		}
		return results;
	},

	parseRecipePage: function(responseText, callback) {
		var doc=System.createDocument(responseText);
		var output=document.getElementById('Helper:RecipeManagerOutput');
		var currentRecipeIndex = callback.recipeIndex;
		var recipe = Helper.recipebook.recipe[currentRecipeIndex];

		output.innerHTML+='Parsing blueprint ' + recipe.name +'...<br/>';

		recipe.credits = System.findNodeInt("//tr[td/img/@title='Credits']/td[1]", doc);
		recipe.items = Helper.parseRecipeItemOrComponent("//td[contains(@background,'/inventory/2x3.gif')]", doc);
		recipe.components  = Helper.parseRecipeItemOrComponent("//td[contains(@background,'/inventory/1x1mini.gif')]", doc);
		recipe.target = Helper.parseRecipeItemOrComponent("//td[contains(@background,'/hellforge/2x3.gif')]", doc)[0];

		var nextRecipeIndex = currentRecipeIndex+1;
		if (nextRecipeIndex<Helper.recipebook.recipe.length) {
			var nextRecipe = Helper.recipebook.recipe[nextRecipeIndex];
			System.xmlhttp('index.php?cmd=inventing&subcmd=viewrecipe&recipe_id=' + nextRecipe.id, Helper.parseRecipePage, {"recipeIndex": nextRecipeIndex});
		}
		else {
			output.innerHTML+='Finished parsing ... formatting ...';
			Helper.recipebook.lastUpdate = new Date();
			System.setValueJSON("recipebook", Helper.recipebook);
			Helper.generateRecipeTable();
		}
	},

	generateRecipeTable: function() {
		var output=document.getElementById('Helper:RecipeManagerOutput');
		var result='<table id="Helper:RecipeTable" width="100%"><tr>' +
			'<th align="left" colspan="2" sortkey="name">Name</th>' +
			'<th align="left">Items</th>' +
			'<th align="left">Components</th>' +
			'<th align="left">Target</th>' +
			'</tr>';
		if (!Helper.recipebook) return;

		var hideRecipes=[];
		if (GM_getValue("hideRecipes")) hideRecipes=GM_getValue("hideRecipeNames").split(",");

		var recipe;
		var c=0;
		for (var i=0; i<Helper.recipebook.recipe.length;i++) {
			recipe=Helper.recipebook.recipe[i];
			c++;

			if (hideRecipes.indexOf(recipe.name) == -1) {
				result+='<tr class="HelperTableRow'+(1+c % 2)+'" valign="middle">' +
					'<td style="border-bottom:1px solid #CD9E4B;"><a href="' + recipe.link + '"><img border="0" align="middle" src="' + recipe.img + '"/></a></td>' +
					'<td style="border-bottom:1px solid #CD9E4B;"><a href="' + recipe.link + '">' + recipe.name + '</a></td>';
				result += '<td style="border-bottom:1px solid #CD9E4B;">';
				if (recipe.items) {
					for (var j=0; j<recipe.items.length; j++) {
						result += recipe.items[j].amountPresent  + "/" + recipe.items[j].amountNeeded +
							' <img border="0" align="middle" onmouseover="ajaxLoadCustom(' +
							recipe.items[j].id + ', -1, 2, ' + Layout.playerId() + ', \'' +
							recipe.items[j].verify + '\', \'\');" ' +
							'src="' + recipe.items[j].img + '"/><br/>';
					}
				}
				result += '</td>';
				result += '<td style="border-bottom:1px solid #CD9E4B;">';
				if (recipe.components) {
					for (var j=0; j<recipe.components.length; j++) {
						result += recipe.components[j].amountPresent + "/" + recipe.components[j].amountNeeded +
							' <img border="0" align="middle" onmouseover="ajaxLoadCustom(' +
							recipe.components[j].id + ', -1, 2, ' + Layout.playerId() + ', \'' +
							recipe.components[j].verify + '\', \'\');" ' +
							'src="' + recipe.components[j].img + '"/><br/>';
					}
				}
				result += '</td>';
				result += '<td style="border-bottom:1px solid #CD9E4B;">';
				if (recipe.target) {
					result += '<img border="0" align="middle" onmouseover="ajaxLoadCustom(' +
						recipe.target.id + ', -1, 2, ' + Layout.playerId() + ', \'' +
						recipe.target.verify + '\', \'\');" ' +
						'src="' + recipe.target.img + '"/>';
				}
				result += '</td>';
				result += '</tr>';
			}
		}
		result+='</table>';
		output.innerHTML=result;

		Helper.recipebook.lastUpdate = new Date();
		System.setValueJSON("recipebook", Helper.recipebook);

		var recipeTable=document.getElementById('Helper:RecipeTable');
		for (var i=0; i<recipeTable.rows[0].cells.length; i++) {
			var cell=recipeTable.rows[0].cells[i];
			if (cell.getAttribute("sortkey")) {
				cell.style.textDecoration="underline";
				cell.style.cursor="pointer";
				cell.addEventListener('click', Helper.sortRecipeTable, true);
			}
		}
	},

	sortRecipeTable: function(evt) {
		Helper.recipebook=System.getValueJSON("recipebook");
		var headerClicked = evt.target.getAttribute("sortKey");
		var sortType = evt.target.getAttribute("sorttype");
		if (!sortType) sortType="string";
		sortType = sortType.toLowerCase();
		if (Helper.sortAsc==undefined) Helper.sortAsc=true;
		if (Helper.sortBy && Helper.sortBy==headerClicked) {
			Helper.sortAsc=!Helper.sortAsc;
		}
		Helper.sortBy=headerClicked;
		//GM_log(headerClicked)
		switch (sortType) {
			case "number":
				Helper.recipebook.recipe.sort(Helper.numberSort)
				break;
			default:
				Helper.recipebook.recipe.sort(Helper.stringSort)
		}
		Helper.generateRecipeTable();
	},

	injectGroupStats: function() {
		var attackTitleElement = System.findNode("//table[@width='400']/tbody/tr/td[contains(.,'Attack:')]");
		attackValueElement = attackTitleElement.nextSibling;
		attackValueElement.innerHTML = "<table><tbody><tr><td style='color:blue;'>" + attackValueElement.innerHTML +
			"</td><td>(</td><td title='attackValue'>" + attackValueElement.innerHTML +
			"</td><td>)</td></tr></tbody></table>";
		var defenseTitleElement = System.findNode("//table[@width='400']/tbody/tr/td[contains(.,'Defense:')]");
		defenseValueElement = defenseTitleElement.nextSibling;
		defenseValueElement.innerHTML = "<table><tbody><tr><td style='color:blue;'>" + defenseValueElement.innerHTML +
			"</td><td>(</td><td title='defenseValue'>" + defenseValueElement.innerHTML +
			"</td><td>)</td></tr></tbody></table>";
		var armorTitleElement = System.findNode("//table[@width='400']/tbody/tr/td[contains(.,'Armor:')]");
		armorValueElement = armorTitleElement.nextSibling;
		armorValueElement.innerHTML = "<table><tbody><tr><td style='color:blue;'>" + armorValueElement.innerHTML +
			"</td><td>(</td><td title='armorValue'>" + armorValueElement.innerHTML +
			"</td><td>)</td></tr></tbody></table>";
		var damageTitleElement = System.findNode("//table[@width='400']/tbody/tr/td[contains(.,'Damage:')]");
		damageValueElement = damageTitleElement.nextSibling;
		damageValueElement.innerHTML = "<table><tbody><tr><td style='color:blue;'>" + damageValueElement.innerHTML +
			"</td><td>(</td><td title='damageValue'>" + damageValueElement.innerHTML +
			"</td><td>)</td></tr></tbody></table>";
		var hpTitleElement = System.findNode("//table[@width='400']/tbody/tr/td[contains(.,'HP:')]");
		hpValueElement = hpTitleElement.nextSibling;
		hpValueElement.innerHTML = "<table><tbody><tr><td style='color:blue;'>" + hpValueElement.innerHTML +
			"</td><td>(</td><td title='hpValue'>" + hpValueElement.innerHTML +
			"</td><td>)</td></tr></tbody></table>";
		System.xmlhttp("index.php?cmd=guild&subcmd=mercs", Helper.parseMercStats);
	},

	parseMercStats: function(responseText) {
		var mercPage=System.createDocument(responseText);
		var mercElements = mercPage.getElementsByTagName("IMG");
		var totalMercAttack = 0;
		var totalMercDefense = 0;
		var totalMercArmor = 0;
		var totalMercDamage = 0;
		var totalMercHP = 0;
		for (var i=0; i<mercElements.length; i++) {
			merc = mercElements[i];
			var mouseoverText = merc.getAttribute("onmouseover")
			var src = merc.getAttribute("src")
			if (mouseoverText && src.search("/merc/") != -1){
				//<td>Attack:</td><td>1919</td>
				var attackRE=/<td>Attack:<\/td><td>(\d+)<\/td>/;
				var mercAttackValue = attackRE.exec(mouseoverText)[1]*1;
				totalMercAttack += mercAttackValue;
				var defenseRE=/<td>Defense:<\/td><td>(\d+)<\/td>/;
				var mercDefenseValue = defenseRE.exec(mouseoverText)[1]*1;
				totalMercDefense += mercDefenseValue;
				var armorRE=/<td>Armor:<\/td><td>(\d+)<\/td>/;
				var mercArmorValue = armorRE.exec(mouseoverText)[1]*1;
				totalMercArmor += mercArmorValue;
				var damageRE=/<td>Damage:<\/td><td>(\d+)<\/td>/;
				var mercDamageValue = damageRE.exec(mouseoverText)[1]*1;
				totalMercDamage += mercDamageValue;
				var hpRE=/<td>HP:<\/td><td>(\d+)<\/td>/;
				var mercHPValue = hpRE.exec(mouseoverText)[1]*1;
				totalMercHP += mercHPValue;
			}
		}
		var attackValue        = System.findNode("//td[@title='attackValue']");
		attackNumber           = System.intValue(attackValue.innerHTML);
		attackValue.innerHTML  = System.addCommas(attackNumber - Math.round(totalMercAttack*0.2));
		var defenseValue       = System.findNode("//td[@title='defenseValue']");
		defenseNumber          = System.intValue(defenseValue.innerHTML);
		defenseValue.innerHTML = System.addCommas(defenseNumber - Math.round(totalMercDefense*0.2));
		var armorValue         = System.findNode("//td[@title='armorValue']");
		armorNumber            = System.intValue(armorValue.innerHTML);
		armorValue.innerHTML   = System.addCommas(armorNumber - Math.round(totalMercArmor*0.2));
		var damageValue        = System.findNode("//td[@title='damageValue']");
		damageNumber           = System.intValue(damageValue.innerHTML);
		damageValue.innerHTML  = System.addCommas(damageNumber - Math.round(totalMercDamage*0.2));
		var hpValue            = System.findNode("//td[@title='hpValue']");
		hpNumber               = System.intValue(hpValue.innerHTML);
		hpValue.innerHTML      = System.addCommas(hpNumber - Math.round(totalMercHP*0.2));
	},

	injectGroups: function() {
		var mainTable = System.findNode("//table[@width='650']");
		var subTable = System.findNode("//table[@width='650']/tbody/tr/td/table");
		var minGroupLevel = GM_getValue("minGroupLevel");
		if (minGroupLevel) {
			var textArea = subTable.rows[0].cells[0];
			textArea.innerHTML += ' <span style="color:blue">Current Min Level Setting: '+ minGroupLevel +'</span>';
		}

		allItems = System.findNodes("//tr[td/a/img/@title='View Group Stats']");
		var memberList=System.getValueJSON("memberlist");
		for (i=0; i<allItems.length; i++) {
			var theItem=allItems[i].cells[0];
			var foundName=theItem.textContent;
			if (memberList) {
				for (j=0; j<memberList.members.length; j++) {
					var aMember=memberList.members[j];
					// I hate doing two loops, but using a hashtable implementation I found crashed my browser...
					if (aMember.name==foundName) {
						theItem.innerHTML = "<span style='font-size:small; " + ((aMember.status == "Online")?"color:green;":"") + "'>" +
							theItem.innerHTML + "</span> [" + aMember.level + "]";
					}
				}
			}
			var theDateCell=allItems[i].cells[2];
			var theDate=theDateCell.firstChild;
			var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
			var xRE=/([a-zA-Z]+), (\d+) ([a-zA-Z]+) (\d+):(\d+):(\d+) UTC/;
			var x=xRE.exec(theDate.innerHTML);
			var month = months.indexOf(x[3]);
			var curYear = new Date().getFullYear();
			var groupDate = new Date();
			groupDate.setUTCDate(x[2]);
			groupDate.setUTCMonth(month);
			groupDate.setUTCFullYear(curYear);
			groupDate.setUTCHours(x[4]);
			groupDate.setUTCMinutes(x[5]);
			theDateCell.innerHTML += '<br><nobr><span style="color:blue; font-size:x-small">Local: '+
				groupDate.toString().substr(0,21)+'</span></nobr>';
		}
		var buttonElement = System.findNode("//td[input[@value='Join All Available Groups']]");
		buttonElement.innerHTML += '&nbsp;<input id="fetchgroupstats" type="button" value="Fetch Group Stats" class="custombutton">';

		document.getElementById('fetchgroupstats').addEventListener('click', Helper.fetchGroupData, true);

	},

	fetchGroupData: function(evt) {
		var calcButton = System.findNode("//input[@id='fetchgroupstats']");
		calcButton.style.display = "none";
		var allItems = System.findNodes("//img[@title='View Group Stats']");
		for (var i=0; i<allItems.length; i++) {
			System.xmlhttp(allItems[i].parentNode.getAttribute("href"), Helper.parseGroupData, allItems[i].parentNode);
		}
	},

	parseGroupData: function(responseText, linkElement) {
		var doc=System.createDocument(responseText);
		var allItems = doc.getElementsByTagName("TD")
		//<td><font color="#333333">Attack:&nbsp;</font></td>

		for (var i=0;i<allItems.length;i++) {
			var anItem=allItems[i];
			if (anItem.innerHTML == '<font color="#333333">Attack:&nbsp;</font>'){
				var attackLocation = anItem.nextSibling;
				var attackValue = attackLocation.textContent;
			}
			if (anItem.innerHTML == '<font color="#333333">Defense:&nbsp;</font>'){
				var defenseLocation = anItem.nextSibling;
				var defenseValue = defenseLocation.textContent;
			}
			if (anItem.innerHTML == '<font color="#333333">Armor:&nbsp;</font>'){
				var armorLocation = anItem.nextSibling;
				var armorValue = armorLocation.textContent;
			}
			if (anItem.innerHTML == '<font color="#333333">Damage:&nbsp;</font>'){
				var damageLocation = anItem.nextSibling;
				var damageValue = damageLocation.textContent;
			}
			if (anItem.innerHTML == '<font color="#333333">HP:&nbsp;</font>'){
				var hpLocation = anItem.nextSibling;
				var hpValue = hpLocation.textContent;
			}
		}
		extraText = "<table cellpadding='1' style='font-size:x-small; border-top:2px black solid; border-spacing: 1px; border-collapse: collapse;'>"
		extraText += "<tr>";
		extraText += "<td style='color:brown;'>Attack</td><td align='right'>" + attackValue + "</td>";
		extraText += "<td style='color:brown;'>Defense</td><td align='right'>" + defenseValue + "</td></tr>";
		extraText += "<tr>";
		extraText += "<td style='color:brown;'>Armor</td><td align='right'>" + armorValue + "</td>";
		extraText += "<td style='color:brown;'>Damage</td><td align='right'>" + damageValue + "</td></tr>";
		extraText += "<tr>";
		extraText += "<td style='color:brown;'>HP</td><td align='right'>" + hpValue + "</td>";
		extraText += "<td colspan='2'></td></tr>";
		extraText += "</table>";
		expiresLocation = linkElement.parentNode.previousSibling.previousSibling;
		expiresLocation.innerHTML += extraText;
	},

	addMarketplaceWidgets: function() {
		var requestTable = System.findNode("//table[tbody/tr/td/input[@value='Confirm Request']]");
		var newRow = requestTable.insertRow(2);
		var newCell = newRow.insertCell(0);
		newCell.id = "warningfield";
		newCell.colSpan = "2";
		newCell.align = "center";

		document.getElementById('price').addEventListener('keyup', Helper.addMarketplaceWarning, true);
	},

	addMarketplaceWarning: function(evt) {
		 var goldPerPoint = System.findNode("//input[@id='price']");
		 var warningField = System.findNode("//td[@id='warningfield']");
		 var sellPrice = goldPerPoint.value;
		 if (sellPrice.search(/^[0-9]*$/) != -1) {
			var warningColor = "green";
			var warningText = "</b><br>This is probably an offer that will please someone.";
			if (sellPrice < 100000) {
				warningColor = "brown";
				var warningText = "</b><br>This is too low ... it just ain't gonna sell.";
			} else if (sellPrice > 150000) {
				warningColor = "red";
				var warningText = "</b><br>Hold up there ... this is way to high a price ... you should reconsider.";
			}
			warningField.innerHTML = "<span style='color:" + warningColor + ";'>You are offering to buy FSP for >> <b>" +
				System.addCommas(sellPrice) + warningText + "</span>";
		}
	},

	injectQuickBuff: function() {
		GM_addStyle('.HelperTextLink {color:white;font-size:x-small;cursor:pointer;}\n' +
			'.HelperTextLink:hover {text-decoration:underline;}\n');
		var playerInput = System.findNode("//input[@name='targetPlayers']");
		var buffMe = document.createElement("SPAN");
		buffMe.innerHTML="[self]";
		buffMe.className='HelperTextLink';
		buffMe.addEventListener("click", Helper.quickBuffMe, true);
		playerInput.parentNode.appendChild(buffMe);

		Helper.injectBuffPackArea();

		var playerIDRE = /tid=(\d+)/;
		var playerID = playerIDRE.exec(location);
		if (playerID) {
			var playerID = playerID[1];
			System.xmlhttp("index.php?cmd=profile&player_id=" + playerID, Helper.getPlayerBuffs, false)
		}
		System.xmlhttp("index.php?cmd=profile", Helper.getSustain)
		
		var buffList = Data.buffList();
		var skillNodes = System.findNodes("//input[@name='skills[]']");
		if (skillNodes) {
			for (var i = 0; i < skillNodes.length; i++ ) {
				var skillName = skillNodes[i].parentNode.parentNode.textContent.match(/\t([A-Z].*) \[/)[1];
				skillNodes[i].setAttribute("skillName", skillName);
				for (var k = 0; k < buffList.length; k++) {
					if (buffList[k].name == skillName) {
						skillNodes[i].setAttribute("staminaCost",buffList[k].stamina);
						break;
					}
				}
				skillNodes[i].addEventListener("click", Helper.toggleBuffStatus, true);
			}
		}
		var activateButton = System.findNode("//input[@value='Activate Selected Skills']");
		activateButton.parentNode.innerHTML += "<br><span style='color:white;'>Stamina to cast selected skills: <span>" +
			"<span id='staminaTotal' style='color:blue;'>0</span>";
	},

	toggleBuffStatus: function(evt) {
		var staminaTotal = System.findNode("//span[@id='staminaTotal']");
		if (evt.target.checked == false) {
			evt.target.checked = false;
			staminaTotal.innerHTML = ((staminaTotal.textContent*1) - (evt.target.getAttribute("staminaCost")*1));
		}
		else if (evt.target.checked == true) {
			evt.target.checked = true;
			staminaTotal.innerHTML = ((staminaTotal.textContent*1) + (evt.target.getAttribute("staminaCost")*1));
		}
	},
	
	injectBuffPackArea: function() {
		Helper.injectBuffPackList();
		Helper.injectBuffPackAddButton();
	},

	injectBuffPackList: function() {
		var injectHere = System.findNode("//input[@value='Activate Selected Skills']/parent::*/parent::*");
		var bpArea = document.createElement("SPAN");
		bpArea.innerHTML="<br><div align='center'><span style='color:lime; font-size:large;'>Buff Packs</span><table id='bpTable' width='600' style='border:1px solid #A07720;' rules=rows><tbody>" +
			"<tr><td style='color:gold; font-weight:bold;'>Nickname</td><td style='color:gold; font-weight:bold;'>Buffs included in the pack</td>" +
			"<td><span id=bpSelectAll class='HelperTextLink'>[All]</span>&nbsp;<span id=bpClear class='HelperTextLink'>[Clear]</span></td></tr>" +
			"</tbody></table></div>";
		bpArea.style.color="white";
		injectHere.appendChild(bpArea);

		document.getElementById("bpSelectAll").addEventListener("click", function() {Helper.setAllSkills(true);}, false);
		document.getElementById("bpClear").addEventListener("click", function() {Helper.setAllSkills(false);}, false);

		var theBuffPack = System.getValueJSON("buffpack")
		if (!theBuffPack) return;

		if (!theBuffPack["nickname"]) { //avoid bugs if the new array is not populated yet
			theBuffPack["nickname"] = {};
		}
		if (!theBuffPack["staminaTotal"]) { //avoid bugs if the new array is not populated yet
			theBuffPack["staminaTotal"] = {};
		}

		var bpTable = document.getElementById("bpTable");
		for (var i = 0; i < theBuffPack["size"]; i++) {
			var myRow = bpTable.insertRow(-1);
			var nickname = (theBuffPack["nickname"][i]? theBuffPack["nickname"][i]:"");
			var listOfBuffs = theBuffPack["bp"][i];
			var staminaTotal = (theBuffPack["staminaTotal"][i]? theBuffPack["staminaTotal"][i]:"");
			myRow.innerHTML = "<td>" + nickname + "</td><td style='font-size:x-small;'>" + listOfBuffs + "&nbsp;" + staminaTotal + "&nbsp" +
				"</td><td><span id=bpSelect" + i + " class='HelperTextLink' buffId=" + i + ">[Select]</span> " +
				"<span id=bpDelete" + i + " buffId=" + i + " class='HelperTextLink'>[X]</span></td>"
			document.getElementById("bpSelect" + i).addEventListener("click", Helper.useBuffPack, true);
			document.getElementById("bpDelete" + i).addEventListener("click", Helper.deleteBuffPack, true);
		}
	},

	setAllSkills: function(value) {
		var skillNodes = System.findNodes("//input[@name='skills[]']");
		if (!skillNodes) return;

		for (var i = 0; i < skillNodes.length; i++ ) {
			skillNodes[i].checked = value;
		}
		Helper.sumStamCostOfSelectedBuffs();
	},

	sumStamCostOfSelectedBuffs: function() {
		var skillNodes = System.findNodes("//input[@name='skills[]']");
		if (!skillNodes) return;

		staminaRunningTotal = 0;
		for (var i = 0; i < skillNodes.length; i++ ) {
			if (skillNodes[i].checked) {
				staminaRunningTotal += (skillNodes[i].getAttribute("staminaCost")*1);
			}
		}

		var staminaTotal = System.findNode("//span[@id='staminaTotal']");
		staminaTotal.innerHTML = staminaRunningTotal;
	},

	useBuffPack: function(evt) {
		var bpIndex=evt.target.getAttribute("buffId");
		var theBuffPack = System.getValueJSON("buffpack")
		if (!theBuffPack) return;
		if (bpIndex >= theBuffPack["size"]) return;

		var buffList = theBuffPack["bp"][bpIndex];
		if (!buffList) return;

		var skillNodes = System.findNodes("//input[@name='skills[]']");
		if (!skillNodes) return;

		for (var i = 0; i < skillNodes.length; i++ ) {
			var skillName = skillNodes[i].parentNode.parentNode.textContent.match(/\t([A-Z].*) \[/)[1];
			if (buffList.indexOf(skillName) >= 0) {
				skillNodes[i].checked = true;
			}
		}
		Helper.sumStamCostOfSelectedBuffs();
	},

	deleteBuffPack: function(evt) {

		if (!window.confirm("Are you sure you want to delete the buff pack?")) return;

		var bpIndex=parseInt(evt.target.getAttribute("buffId"));
		var theBuffPack = System.getValueJSON("buffpack")
		if (!theBuffPack) return;
		if (!theBuffPack["size"]) return;

		theBuffPack["size"] --;
		if (theBuffPack["size"] == 0) { // avoid bugs :)
			delete theBuffPack["bp"];
			delete theBuffPack["nickname"];
			delete theBuffPack["staminaTotal"];
			theBuffPack["bp"] = {};
			theBuffPack["nickname"] = {};
			theBuffPack["staminaTotal"] = {};
		}
		if (!theBuffPack["nickname"]) { //avoid bugs
			theBuffPack["nickname"] = {};
		}
		if (!theBuffPack["staminaTotal"]) { //avoid bugs
			theBuffPack["staminaTotal"] = {};
		}
		for (var i = bpIndex; i < theBuffPack["size"]; i++) {
			theBuffPack["bp"][i] = theBuffPack["bp"][i + 1];
			//old buff packs won't have the next two values.
			theBuffPack["nickname"][i] = (theBuffPack["nickname"][i + 1]? theBuffPack["nickname"][i + 1]:"");
			theBuffPack["staminaTotal"][i] = (theBuffPack["staminaTotal"][i + 1]? theBuffPack["staminaTotal"][i + 1]:"");
		}

		delete theBuffPack["bp"][theBuffPack["size"]];
		if (theBuffPack["nickname"][theBuffPack["size"]]) delete theBuffPack["nickname"][theBuffPack["size"]];
		if (theBuffPack["staminaTotal"][theBuffPack["size"]]) delete theBuffPack["staminaTotal"][theBuffPack["size"]];

		System.setValueJSON("buffpack", theBuffPack);
		location.reload(true);
	},

	injectBuffPackAddButton: function() {
		var bpTable = document.getElementById("bpTable");
		var myRow = bpTable.insertRow(-1);
		myRow.innerHTML = "<td><input size=10 id='newBuffPackNickname' name='newBuffPackNickname' value='nickname'></td>"+
			"<td><input size=60 id='newBuffPack' name='newBuffPack' value='full buff names, separated by comma'></td>" +
			"<td><span id=bpSave class='HelperTextLink'>[Save]</span><span id=bpAdd class='HelperTextLink'>[add]</span></td>";

		// button handlers
		document.getElementById("bpAdd").addEventListener("click", Helper.displayAddBuffPack, true);
		document.getElementById("bpSave").addEventListener("click", Helper.saveBuffPack, true);

		// display [add] only
		document.getElementById("newBuffPack").style.visibility = "hidden";
		document.getElementById("newBuffPackNickname").style.visibility = "hidden";
		document.getElementById("bpAdd").style.visibility = "";
		document.getElementById("bpSave").style.visibility = "hidden";
	},

	displayAddBuffPack: function() {
		document.getElementById("newBuffPack").style.visibility = "";
		document.getElementById("newBuffPackNickname").style.visibility = "";
		document.getElementById("bpAdd").style.visibility = "hidden";
		document.getElementById("bpSave").style.visibility = "";
	},

	saveBuffPack: function() {
		if (!document.getElementById("newBuffPack").value) return;
		if (!document.getElementById("newBuffPackNickname").value) return;

		var theBuffPack = System.getValueJSON("buffpack")
		if (!theBuffPack) {
			theBuffPack = {};
			theBuffPack["size"] = 0;
			theBuffPack["bp"] = {};
			theBuffPack["nickname"] = {};
			theBuffPack["staminaTotal"] = {};
		}
		if (!theBuffPack["nickname"]) { //avoid bugs
			theBuffPack["nickname"] = {};
		}
		if (!theBuffPack["staminaTotal"]) { //avoid bugs
			theBuffPack["staminaTotal"] = {};
		}
		theBuffPack["bp"][theBuffPack["size"]] = document.getElementById("newBuffPack").value;
		theBuffPack["nickname"][theBuffPack["size"]] = document.getElementById("newBuffPackNickname").value;
		var listOfBuffs = theBuffPack["bp"][theBuffPack["size"]];
		var buffArray = listOfBuffs.split(",");
		var buffList = Data.buffList();
		var staminaTotal = 0;
		for (var j = 0; j < buffArray.length; j++) {
			for (var k = 0; k < buffList.length; k++) {
				if (buffArray[j].trim() == buffList[k].name) {
					staminaTotal += buffList[k].stamina;
					break;
				}
			}
		}
		theBuffPack["staminaTotal"][theBuffPack["size"]] = "<span style='color:blue;'>(" + staminaTotal + ")</span>";
		
		//increase the size of the array
		theBuffPack["size"] += 1;

		// save and reload
		System.setValueJSON("buffpack", theBuffPack);
		location.reload(true);
	},

	quickBuffMe: function() {
		var playerInput = System.findNode("//input[@name='targetPlayers']");
		playerInput.value=GM_getValue("CharacterName");
		if (Helper.tmpSelfProfile) {
			Helper.getPlayerBuffs(Helper.tmpSelfProfile, true);
		}
	},

	getPlayerBuffs: function(responseText, keepPlayerInput) {
		var injectHere = System.findNode("//input[@value='Activate Selected Skills']/parent::*/parent::*");
		var resultText = "<table align='center'><tr><td colspan='4' style='color:lime;font-weight:bold'>Buffs already on player:</td></tr>";

		if (keepPlayerInput) {
			var playerInput = System.findNode("//input[@name='targetPlayers']");
			var playerName = playerInput.value;
		}

		//low level buffs used to get the buff above are not really worth casting.
		var buffs = Data.buffList();
		var myBuffs = System.findNodes("//font[@size='1']");
		for (var i=0;i<myBuffs.length;i++) {
			var myBuff=myBuffs[i];
			var myBuffName = /([ a-zA-Z]+)\s\[/.exec(myBuff.innerHTML)[1];
			var buffFound = false;
			for (var j=0;j<buffs.length;j++) {
				buffName = buffs[j].name;
				if (myBuffName == buffName) {
					var onmouseoverText='Tip(\'' +
						'<span style=\\\'font-weight:bold; color:#FFF380;\\\'>' + buffName + '</span><br /><br />Stamina: ' +
						buffs[j].stamina + '<br>Duration: ' +
						buffs[j].duration + '<br>Effect: ' +
						buffs[j].buff + '\');'
					myBuff.setAttribute("onmouseover", onmouseoverText);
					buffFound = true;
					break
				}
			}
			if (!buffFound) GM_log("Buff typo in data file: '" + myBuffName + "'");
			var buffLevelRE = /\[(\d+)\]/
			var buffLevel = buffLevelRE.exec(myBuff.innerHTML)[1]*1;
			if (buffLevel < 75
			    && myBuff.innerHTML.search("Counter Attack") == -1 && myBuff.innerHTML.search("Quest Finder") == -1
				&& myBuff.innerHTML.search("Death Dealer") == -1 && myBuff.innerHTML.search("Vision") == -1) {
				myBuff.style.color = "gray";
			}
		}

		//this could be formatted better ... it looks ugly but my quick attempts at putting it in a table didn't work.
		var doc=System.createDocument(responseText);
		var buffs = System.findNodes("//img[contains(@onmouseover,'tt_setWidth(105)')]", doc);
		if (buffs) {
			var buffRE, buff, buffName, buffLevel;
			for (var i=0;i<buffs.length;i++) {
				var aBuff=buffs[i];
				var onmouseover = aBuff.getAttribute("onmouseover");
				if (onmouseover.search("Summon Shield Imp") != -1) {
					//tt_setWidth(105); Tip('<center><b>Summon Shield Imp<br>6 HP remaining<br></b> (Level: 150)</b></center>');
					//tt_setWidth(105); Tip('<center><b>Summon Shield Imp<br> HP remaining<br></b> (Level: 165)</b></center>');
					buffRE = /<b>([ a-zA-Z]+)<br>([0-9]+) HP remaining<br><\/b> \(Level: (\d+)\)/
					buff = buffRE.exec(onmouseover);
					if (!buff) {
						buffRE = /<b>([ a-zA-Z]+)<br> HP remaining<br><\/b> \(Level: (\d+)\)/
						buff = buffRE.exec(onmouseover);
					}
					if (!buff) GM_log(onmouseover);
					buffName = buff[1];
					buffLevel = buff[3];
				} else {
					buffRE = /<b>([ a-zA-Z]+)<\/b> \(Level: (\d+)\)/
					buff = buffRE.exec(onmouseover);
					buffName = buff[1];
					buffLevel = buff[2];
				}
				if (!buffLevel) buffLevel = 0; //For when a shield imp runs out but the buff is still there (0HP)
				resultText += ((i % 4 == 0)? "<tr>":"");
				resultText += "<td style='color:white; font-size:x-small'>" + buffName + "</td><td style='color:silver; font-size:x-small'>[" + buffLevel + "]</td>";
				resultText += ((i % 4 == 3)? "</tr>":"");
				var hasThisBuff = System.findNode("//font[contains(.,'" + buffName + "')]");
				if (hasThisBuff) {
					var buffLevelRE = /\[(\d+)\]/
					var buffLevel = parseInt(buffLevelRE.exec(hasThisBuff.innerHTML)[1]);
					if (buffLevel > 11 ||
					    buffName == 'Quest Finder') {
						hasThisBuff.style.color='lime';
					}
				}
			}
			resultText += ((i % 4 == 3)? "<td></td></tr>":"");
		} else {
			resultText += "<tr><td colspan='4' style='text-align:center;color:white; font-size:x-small'>[no buffs]</td></tr>";
		}

		//var playerLevel=Helper.findNodeText("//td[contains(b,'Level:')]/following-sibling::td[1]", doc);
		//var playerXP=Helper.findNodeText("//td[contains(b,'XP:')]/following-sibling::td[1]", doc);
		resultText += "</table>"

		var statistics = System.findNode("//tr[contains(td/b,'Statistics')]/following-sibling::tr[2]/td/table", doc);
		statistics.style.backgroundImage = 'url(' + System.imageServer + '/skin/realm_top_b2.jpg)'; //Color='white';
		var staminaCell = statistics.rows[7].cells[1].firstChild.rows[0].cells[0];
		var curStamina = System.intValue(staminaCell.textContent.split("/")[0]);
		var maxStamina = System.intValue(staminaCell.textContent.split("/")[1]);
		staminaCell.textContent += "(" + Math.round((100.0*curStamina)/(1.0*maxStamina)) + "%)";

		var lastActivity = System.findNode("//font[contains(.,'Last Activity:')]", doc);
		if (lastActivity) {
			var newRow = statistics.insertRow(0);
			var newCell = newRow.insertCell(0);
			newCell.setAttribute('colspan', '4');
			newCell.style.textAlign='center';
			newCell.innerHTML=lastActivity.innerHTML + '<br/>';
		}

		resultText += statistics.parentNode.innerHTML;

		// injectHere.innerHTML += "<br/><span style='color:lime;font-weight:bold'>Buffs already on player:</span><br/>"
		// injectHere.innerHTML += resultText; // "<br/><span style='color:lime;font-weight:bold'>Buffs already on player:</span><br/>"
		var newNode = document.createElement("SPAN");
		newNode.innerHTML = resultText;
		injectHere.appendChild(newNode);

		if (keepPlayerInput) {
			playerInput = System.findNode("//input[@name='targetPlayers']");
			playerInput.value = playerName;
		}
	},

	getSustain: function(responseText) {
		var doc=System.createDocument(responseText);
		Helper.tmpSelfProfile=responseText;
		var sustainText = System.findNode("//a[contains(@onmouseover,'<b>Sustain</b>')]", doc);
		if (!sustainText) return;
		var sustainMouseover = sustainText.parentNode.parentNode.parentNode.nextSibling.nextSibling.firstChild.getAttribute("onmouseover");
		var sustainLevelRE = /Level<br>(\d+)%/
		var sustainLevel = sustainLevelRE.exec(sustainMouseover)[1];
		var activateInput = System.findNode("//input[@value='activate']");
		var inputTable = activateInput.nextSibling.nextSibling;
		var injectHere = inputTable.rows[3].cells[0];
		injectHere.align = "center";
		injectHere.innerHTML += "&nbsp;<span style='color:orange;'>Your Sustain level: " + sustainLevel + "%</span>";
		var furyCasterText = System.findNode("//a[contains(@onmouseover,'<b>Fury Caster</b>')]", doc);
		if (!furyCasterText) return;
		var furyCasterMouseover = furyCasterText.parentNode.parentNode.parentNode.nextSibling.nextSibling.firstChild.getAttribute("onmouseover");
		var furyCasterLevelRE = /Level<br>(\d+)%/
		var furyCasterLevel = furyCasterLevelRE.exec(furyCasterMouseover)[1];
		injectHere.innerHTML += "&nbsp;<span style='color:orange;'>Your Fury Caster level: " + furyCasterLevel + "%</span>";
		var hasBuffMasterBuff = System.findNode("//img[contains(@onmouseover,'Buff Master')]", doc);
		if (hasBuffMasterBuff) {
			injectHere.innerHTML += "&nbsp;<span style='color:orange;'>Buff Master:	On</span>";
			var buffMasterTimeToExpire = hasBuffMasterBuff.parentNode.nextSibling.nextSibling.innerHTML
			injectHere.innerHTML += "&nbsp;<span style='color:white; font-size:x-small;'>(" + buffMasterTimeToExpire +")</span>";
		}
		else {
			injectHere.innerHTML += " <span style='color:orange;'>Buff Master: Off</span>";
		}
	},

	getKillStreak: function(responseText) {
		var doc=System.createDocument(responseText);
		//Kill&nbsp;Streak:&nbsp;
		var killStreakText = System.findNode("//b[contains(.,'Kill')]", doc);
		if (killStreakText) {
			var killStreakLocation = killStreakText.parentNode.nextSibling;
			var playerKillStreakValue = System.intValue(killStreakLocation.textContent);
		}
		var killStreakElement = System.findNode("//span[@findme='killstreak']");
		killStreakElement.innerHTML = System.addCommas(playerKillStreakValue);
		GM_setValue("lastKillStreak", playerKillStreakValue);
		var deathDealerBuff = System.findNode("//img[contains(@onmouseover,'Death Dealer')]");
		var deathDealerRE = /<b>Death Dealer<\/b> \(Level: (\d+)\)/
		var deathDealer = deathDealerRE.exec(deathDealerBuff.getAttribute("onmouseover"));
		if (deathDealer) {
			var deathDealerLevel = deathDealer[1];
			var deathDealerPercentage = (Math.min(Math.round(Math.floor(playerKillStreakValue/5) * deathDealerLevel) * 0.01, 20))
		}
		var deathDealerPercentageElement = System.findNode("//span[@findme='damagebonus']");
		deathDealerPercentageElement.innerHTML = deathDealerPercentage;
		GM_setValue("lastDeathDealerPercentage", deathDealerPercentage);
	},

	injectCreature: function() {
		System.xmlhttp("index.php?cmd=profile", Helper.getCreaturePlayerData, 
			{"groupExists": false, "groupAttackValue": 0, "groupDefenseValue": 0
				, "groupArmorValue": 0, "groupDamageValue": 0, "groupHPValue": 0});
		System.xmlhttp("index.php?cmd=guild&subcmd=groups", Helper.checkIfGroupExists);

		var creatureName = System.findNode('//td[@align="center"]/font[@size=3]/b');
		if (creatureName) {
			creatureName.innerHTML += ' <a href="http://www.fallenswordguide.com/creatures/?search=' + creatureName.textContent + '" target="_blank">' +
				'<img border=0 title="Search creature in FSG" width=10 height=10 src="http://www.fallenswordguide.com/favicon.ico"/></a>' +
				' <a href="http://wiki.fallensword.com/index.php/Special:Search?search=' + creatureName.textContent + '&go=Go" target="_blank">' +
				'<img border=0 title="Search creature in Wiki" width=10 height=10 src="/favicon.ico"/></a>'
		}
	},

	checkIfGroupExists: function(responseText) {
		var doc=System.createDocument(responseText);
		var groupExistsIMG = System.findNode("//img[@title='Disband Group (Cancel Attack)']",doc);
		if (groupExistsIMG) {
			var groupHref = groupExistsIMG.parentNode.parentNode.firstChild.getAttribute("href");
			System.xmlhttp(groupHref, Helper.getCreatureGroupData);
		}
	},

	getCreatureGroupData: function(responseText) {
		var doc=System.createDocument(responseText);
		var groupAttackValue = System.findNode("//table[@width='400']/tbody/tr/td[contains(.,'Attack:')]",doc).nextSibling.textContent.replace(/,/,"")*1;
		var groupDefenseValue = System.findNode("//table[@width='400']/tbody/tr/td[contains(.,'Defense:')]",doc).nextSibling.textContent.replace(/,/,"")*1;
		var groupArmorValue = System.findNode("//table[@width='400']/tbody/tr/td[contains(.,'Armor:')]",doc).nextSibling.textContent.replace(/,/,"")*1;
		var groupDamageValue = System.findNode("//table[@width='400']/tbody/tr/td[contains(.,'Damage:')]",doc).nextSibling.textContent.replace(/,/,"")*1;
		var groupHPValue = System.findNode("//table[@width='400']/tbody/tr/td[contains(.,'HP:')]",doc).nextSibling.textContent.replace(/,/,"")*1;
		System.xmlhttp("index.php?cmd=profile", Helper.getCreaturePlayerData, 
			{"groupExists": true, "groupAttackValue": groupAttackValue, "groupDefenseValue": groupDefenseValue
				, "groupArmorValue": groupArmorValue, "groupDamageValue": groupDamageValue, "groupHPValue": groupHPValue});
	},
	
	getCreaturePlayerData: function(responseText, callback) {
		//playerdata
		var doc=System.createDocument(responseText);
		var allItems = doc.getElementsByTagName("B");
		for (var i=0;i<allItems.length;i++) {
			var anItem=allItems[i];
			if (anItem.innerHTML == "Attack:&nbsp;"){
				var attackText = anItem;
				var attackLocation = attackText.parentNode.nextSibling.firstChild.firstChild.firstChild.firstChild;
				var playerAttackValue = parseInt(attackLocation.textContent);
				var defenseText = attackText.parentNode.nextSibling.nextSibling.nextSibling.firstChild;
				var defenseLocation = defenseText.parentNode.nextSibling.firstChild.firstChild.firstChild.firstChild;
				var playerDefenseValue = parseInt(defenseLocation.textContent);
				var armorText = defenseText.parentNode.parentNode.nextSibling.nextSibling.firstChild.nextSibling.firstChild;
				var armorLocation = armorText.parentNode.nextSibling.firstChild.firstChild.firstChild.firstChild;
				var playerArmorValue = parseInt(armorLocation.textContent);
				var damageText = armorText.parentNode.nextSibling.nextSibling.nextSibling.firstChild;
				var damageLocation = damageText.parentNode.nextSibling.firstChild.firstChild.firstChild.firstChild;
				var playerDamageValue = parseInt(damageLocation.textContent);
				var hpText = damageText.parentNode.parentNode.nextSibling.nextSibling.firstChild.nextSibling.firstChild;
				var hpLocation = hpText.parentNode.nextSibling.firstChild.firstChild.firstChild.firstChild;
				var playerHPValue = parseInt(hpLocation.textContent);
			}
			if (anItem.innerHTML == "Kill&nbsp;Streak:&nbsp;"){
				var killStreakText = anItem;
				var killStreakLocation = killStreakText.parentNode.nextSibling;
				var playerKillStreakValue = System.intValue(killStreakLocation.textContent);
			}
		}
		//get buffs here later ... DD, CA, DC, Constitution, etc
		var allItems = doc.getElementsByTagName("IMG");
		var counterAttackLevel = 0, doublerLevel = 0, deathDealerLevel = 0, darkCurseLevel = 0, holyFlameLevel = 0;
		var constitutionLevel = 0, sanctuaryLevel = 0, flinchLevel = 0, nightmareVisageLevel = 0, superEliteSlayerLevel = 0;
		for (var i=0;i<allItems.length;i++) {
			var anItem=allItems[i];
			if (anItem.getAttribute("src").search("/skills/") != -1) {
				var onmouseover = anItem.getAttribute("onmouseover")
				var counterAttackRE = /<b>Counter Attack<\/b> \(Level: (\d+)\)/
				var counterAttack = counterAttackRE.exec(onmouseover);
				if (counterAttack) {
					counterAttackLevel = counterAttack[1];
					continue;
				}
				var doublerRE = /<b>Doubler<\/b> \(Level: (\d+)\)/
				var doubler = doublerRE.exec(onmouseover);
				if (doubler) {
					doublerLevel = doubler[1];
					continue;
				}
				var deathDealerRE = /<b>Death Dealer<\/b> \(Level: (\d+)\)/
				var deathDealer = deathDealerRE.exec(onmouseover);
				if (deathDealer) {
					deathDealerLevel = deathDealer[1];
					continue;
				}
				var darkCurseRE = /<b>Dark Curse<\/b> \(Level: (\d+)\)/
				var darkCurse = darkCurseRE.exec(onmouseover);
				if (darkCurse) {
					darkCurseLevel = darkCurse[1];
					continue;
				}
				var holyFlameRE = /<b>Holy Flame<\/b> \(Level: (\d+)\)/
				var holyFlame = holyFlameRE.exec(onmouseover);
				if (holyFlame) {
					holyFlameLevel = holyFlame[1];
					continue;
				}
				var constitutionRE = /<b>Constitution<\/b> \(Level: (\d+)\)/
				var constitution = constitutionRE.exec(onmouseover);
				if (constitution) {
					constitutionLevel = constitution[1];
					continue;
				}
				var sanctuaryRE = /<b>Sanctuary<\/b> \(Level: (\d+)\)/
				var sanctuary = sanctuaryRE.exec(onmouseover);
				if (sanctuary) {
					sanctuaryLevel = sanctuary[1];
					continue;
				}
				var flinchRE = /<b>Flinch<\/b> \(Level: (\d+)\)/
				var flinch = flinchRE.exec(onmouseover);
				if (flinch) {
					flinchLevel = flinch[1];
					continue;
				}
				var nightmareVisageRE = /<b>Nightmare Visage<\/b> \(Level: (\d+)\)/
				var nightmareVisage = nightmareVisageRE.exec(onmouseover);
				if (nightmareVisage) {
					nightmareVisageLevel = nightmareVisage[1];
					continue;
				}
				var superEliteSlayerRE = /<b>Super Elite Slayer<\/b> \(Level: (\d+)\)/
				var superEliteSlayer = superEliteSlayerRE.exec(onmouseover);
				if (superEliteSlayer) {
					superEliteSlayerLevel = superEliteSlayer[1];
					continue;
				}
			}
		}
		//group data (if appropriate)
		var groupAttackValue = 0, groupDefenseValue = 0,  groupArmorValue = 0, groupDamageValue = 0, groupHPValue = 0;
		groupExists = callback.groupExists;
		if (groupExists) {
			var groupAttackValue = callback.groupAttackValue;
			var groupDefenseValue = callback.groupDefenseValue;
			var groupArmorValue = callback.groupArmorValue;
			var groupDamageValue = callback.groupDamageValue;
			var groupHPValue = callback.groupHPValue;
		}
		//creaturedata
		var creatureStatTable = System.findNode("//table[tbody/tr/td[.='Statistics']]");
		if (!creatureStatTable) {return;}
		var creatureClass   = creatureStatTable.rows[1].cells[1].textContent;
		var creatureLevel   = creatureStatTable.rows[1].cells[3].textContent;
		var creatureAttack  = System.intValue(creatureStatTable.rows[2].cells[1].textContent);
		var creatureDefense = System.intValue(creatureStatTable.rows[2].cells[3].textContent);
		var creatureArmor   = System.intValue(creatureStatTable.rows[3].cells[1].textContent);
		var creatureDamage  = System.intValue(creatureStatTable.rows[3].cells[3].textContent);
		var creatureHP      = System.intValue(creatureStatTable.rows[4].cells[1].textContent);
		var extraNotes = "", holyFlameBonusDamage = 0;
		//reduce stats if critter is a SE and player has SES cast on them.
		var superEliteSlayerMultiplier = 1;
		if (superEliteSlayerLevel > 0) {
			superEliteSlayerMultiplier = Math.round(0.002 * superEliteSlayerLevel*100)/100;
		}
		var creatureName = System.findNode("//td/font[@size='3'][b]").textContent.trim();
		if (creatureName.search("Super Elite") != -1) {
			creatureAttack -= Math.ceil(creatureAttack * superEliteSlayerMultiplier);
			creatureDefense -= Math.ceil(creatureDefense * superEliteSlayerMultiplier);
			creatureDefense -= Math.ceil(creatureDefense * superEliteSlayerMultiplier);
			creatureArmor -= Math.ceil(creatureArmor * superEliteSlayerMultiplier);
			creatureHP -= Math.ceil(creatureHP * superEliteSlayerMultiplier);
			extraNotes += (superEliteSlayerLevel > 0? "SES Stat Reduction Multiplier = " + superEliteSlayerMultiplier + "<br>":"");
		}
		//math section ... analysis
		//Holy Flame adds its bonus after the armor of the creature has been taken off.
		if (creatureClass == "Undead") {
			holyFlameBonusDamage = Math.floor((playerDamageValue - creatureArmor) * holyFlameLevel * 0.002);
			extraNotes += (holyFlameLevel > 0? "HF Bonus Damage = " + holyFlameBonusDamage + "<br>":"");
		}
		//Death Dealer and Counter Attack both applied at the same time
		var deathDealerBonusDamage = Math.floor(playerDamageValue * (Math.min(Math.floor(playerKillStreakValue/5) * 0.01 * deathDealerLevel, 20)/100));
		var counterAttackBonusAttack = Math.floor(playerAttackValue * 0.0025 * counterAttackLevel);
		var counterAttackBonusDamage = Math.floor(playerDamageValue * 0.0025 * counterAttackLevel);
		var extraStaminaPerHit = (counterAttackLevel > 0? Math.ceil((1+(doublerLevel/50))*0.0025*counterAttackLevel) :0);
		//playerAttackValue += counterAttackBonusAttack;
		//playerDamageValue += deathDealerBonusDamage + counterAttackBonusDamage;
		extraNotes += (deathDealerLevel > 0? "DD Bonus Damage = " + deathDealerBonusDamage + "<br>":"");
		if (counterAttackLevel > 0) {
			extraNotes += "CA Bonus Attack/Damage = " + counterAttackBonusAttack + " / " + counterAttackBonusDamage + "<br>";
			extraNotes += "CA Extra Stam Used = " + extraStaminaPerHit + "<br>";
		}
		//Attack:
		extraNotes += (darkCurseLevel > 0? "DC Bonus Attack = " + Math.floor(creatureDefense * darkCurseLevel * 0.002) + "<br>":"");
		var nightmareVisageAttackMovedToDefense = Math.floor(playerAttackValue * nightmareVisageLevel * 0.0025);
		extraNotes += (nightmareVisageLevel > 0? "NV Attack moved to Defense = " + nightmareVisageAttackMovedToDefense + "<br>":"");
		var overallAttackValue = (groupExists?groupAttackValue:playerAttackValue) + counterAttackBonusAttack - nightmareVisageAttackMovedToDefense;
		var hitByHowMuch = (overallAttackValue - Math.ceil(1.1053*(creatureDefense - (creatureDefense * darkCurseLevel * 0.002))));
		//Damage:
		var overallDamageValue = (groupExists?groupDamageValue:playerDamageValue) + deathDealerBonusDamage + counterAttackBonusDamage + holyFlameBonusDamage;
		var damageDone = Math.floor(overallDamageValue - ((1.1053*creatureArmor) + (1.053*creatureHP)));
		var numberOfHitsRequired = (hitByHowMuch > 0? Math.ceil((1.053*creatureHP)/((overallDamageValue < (1.1053*creatureArmor))? 1: overallDamageValue - (1.1053*creatureArmor))):"-");
		//Defense:
		var overallDefenseValue = (groupExists?groupDefenseValue:playerDefenseValue) + Math.floor(playerDefenseValue * constitutionLevel * 0.001) + nightmareVisageAttackMovedToDefense;
		extraNotes += (constitutionLevel > 0? "Constitution Bonus Defense = " + Math.floor(playerDefenseValue * constitutionLevel * 0.001) + "<br>":"");
		extraNotes += (flinchLevel > 0? "Flinch Bonus Attack Reduction = " + Math.floor(creatureAttack * flinchLevel * 0.001) + "<br>":"");
		var creatureHitByHowMuch = Math.floor((1.1053*creatureAttack - (creatureAttack * flinchLevel * 0.001)) - overallDefenseValue);
		//Armor and HP:
		var overallArmorValue = (groupExists?groupArmorValue:playerArmorValue) + Math.floor(playerArmorValue * sanctuaryLevel * 0.001);
		extraNotes += (sanctuaryLevel > 0? "Sanc Bonus Armor = " + Math.floor(playerArmorValue * sanctuaryLevel * 0.001) + "<br>":"");
		var overallHPValue = (groupExists?groupHPValue:playerHPValue);
		var creatureDamageDone = Math.ceil((1.1053*creatureDamage) - (overallArmorValue + overallHPValue));
		var numberOfCreatureHitsTillDead = (creatureHitByHowMuch >= 0? Math.ceil(overallHPValue/(((1.1053*creatureDamage) < (overallArmorValue))? 1: (1.1053*creatureDamage) - (overallArmorValue))):"-");
		//Analysis:
		var playerHits = (numberOfCreatureHitsTillDead=="-"? numberOfHitsRequired:(numberOfHitsRequired=="-"?"-":(numberOfHitsRequired>numberOfCreatureHitsTillDead?"-":numberOfHitsRequired)));
		var creatureHits = (numberOfHitsRequired=="-"?numberOfCreatureHitsTillDead:(numberOfCreatureHitsTillDead=="-"?"-":(numberOfCreatureHitsTillDead>numberOfHitsRequired?"-":numberOfCreatureHitsTillDead)));
		var fightStatus = "Unknown";
		if (playerHits == "-" && creatureHits == "-") {
			fightStatus = "Unresolved";
		} else if (playerHits == "-") {
			fightStatus = "Player dies";
		} else if (playerHits == 1) {
			fightStatus = "Player 1 hits" + (numberOfCreatureHitsTillDead-numberOfHitsRequired<=1? ", dies on miss":", survives a miss");
		} else if (playerHits > 1) {
			fightStatus = "Player > 1 hits" + (numberOfCreatureHitsTillDead-numberOfHitsRequired<=1? ", dies on miss":", survives a miss");
		}
		if (counterAttackLevel > 0 && numberOfHitsRequired == "1") {
			var lowestCALevelToStillHit = Math.max(Math.ceil((counterAttackBonusAttack-hitByHowMuch + 1)/playerAttackValue/0.0025), 0);
			var lowestCALevelToStillKill = Math.max(Math.ceil((counterAttackBonusDamage-damageDone + 1)/playerDamageValue/0.0025), 0);
			var lowestFeasibleCALevel = Math.max(lowestCALevelToStillHit,lowestCALevelToStillKill);
			extraNotes += "Lowest CA to still 1-hit this creature = " + lowestFeasibleCALevel + "<br>";
			if (lowestFeasibleCALevel != 0) {
				var extraAttackAtLowestFeasibleCALevel = Math.floor(playerAttackValue * 0.0025 * lowestFeasibleCALevel);
				var extraDamageAtLowestFeasibleCALevel = Math.floor(playerDamageValue * 0.0025 * lowestFeasibleCALevel);
				extraNotes += "Extra CA Att/Dam at this lowered CA level = " + extraAttackAtLowestFeasibleCALevel + " / " + extraDamageAtLowestFeasibleCALevel + "<br>";
			}
			var extraStaminaPerHitAtLowestFeasibleCALevel = (counterAttackLevel > 0? Math.ceil((1+(doublerLevel/50))*0.0025*lowestFeasibleCALevel) :0);
			if (extraStaminaPerHitAtLowestFeasibleCALevel < extraStaminaPerHit) {
				extraNotes += "Extra Stam Used at this lowered CA level = " + extraStaminaPerHitAtLowestFeasibleCALevel + "<br>";
			}
			else {
				extraNotes += "No reduction of stam used at the lower CA level<br>";
			}
		}
		
		//display data
		var newRow = creatureStatTable.insertRow(creatureStatTable.rows.length);
		var newCell = newRow.insertCell(0);
		newCell.colSpan = '4';
		newCell.innerHTML = "<table width='100%'><tbody><tr><td bgcolor='#CD9E4B' colspan='4' align='center'>" + (groupExists? "Group ":"") + "Combat Evaluation</td></tr>" +
			"<tr><td align='right'><span style='color:#333333'>Will I hit it? </td><td align='left'>" + (hitByHowMuch > 0? "Yes":"No") + "</td>" +
				"<td align='right'><span style='color:#333333'>Extra Attack: </td><td align='left'>( " + hitByHowMuch + " )</td></tr>" +
			"<tr><td align='right'><span style='color:#333333'># Hits to kill it? </td><td align='left'>" + numberOfHitsRequired + "</td>" +
				"<td align='right'><span style='color:#333333'>Extra Damage: </td><td align='left'>( " + damageDone + " )</td></tr>" +
			"<tr><td align='right'><span style='color:#333333'>Will I be hit? </td><td align='left'>" + (creatureHitByHowMuch >= 0? "Yes":"No") + "</td>" +
				"<td align='right'><span style='color:#333333'>Extra Defense: </td><td align='left'>( " + (-1 * creatureHitByHowMuch) + " )</td></tr>" +
			"<tr><td align='right'><span style='color:#333333'># Hits to kill me? </td><td align='left'>" + numberOfCreatureHitsTillDead + "</td>" +
				"<td align='right'><span style='color:#333333'>Extra Armor + HP: </td><td align='left'>( " + (-1 * creatureDamageDone) + " )</td></tr>" +
			"<tr><td align='right'><span style='color:#333333'># Player Hits? </td><td align='left'>" + playerHits + "</td>" +
				"<td align='right'><span style='color:#333333'># Creature Hits? </td><td align='left'>" + creatureHits + "</td></tr>" +
			"<tr><td align='right'><span style='color:#333333'>Fight Status: </span></td><td align='left' colspan='3'><span>" + fightStatus + "</span></td></tr>" +
			"<tr><td align='right'><span style='color:#333333'>Notes: </span></td><td align='left' colspan='3'><span style='font-size:x-small;'>" +
				extraNotes + "</span></td></tr>" +
			"<tr><td colspan='4'><span style='font-size:x-small; color:gray'>" +
				"*Does include CA, DD, HF, DC, Flinch, Super Elite Slayer, NV, Sanctuary and Constitution (if active) and allow for randomness (1.1053). Does not include Chi Strike or Terrorize (because I haven't done them yet).</span></td></tr>" +
			"</tbody></table>";
	},

	injectBioWidgets: function() {
		var textArea = System.findNode("//textarea[@name='bio']");
		//textArea.rows=15;
		textArea.cols=60;
		textArea.id = "biotext";
		var textAreaTable = textArea.parentNode.parentNode.parentNode.parentNode;
		var bioPreviewHTML = System.convertTextToHtml(textArea.value);
		var newRow = textAreaTable.insertRow(-1);
		var newCell = newRow.insertCell(0);
		newCell.innerHTML = '<table align="center" width="325" border="1"><tbody>' +
			'<tr><td style="text-align:center;color:#7D2252;background-color:#CD9E4B">Preview</td></tr>' +
			'<tr><td width="325"><span style="font-size:small;" findme="biopreview">' + bioPreviewHTML +
			'</span></td></tr></tbody></table>';
		var innerTable = System.findNode("//table[tbody/tr/td/font/b[.='Update your Character Biography']]");
		var crCount = 0;
		var startIndex = 0;
		while (textArea.value.indexOf('\n',startIndex+1) != -1) {
			crCount++;
			startIndex = textArea.value.indexOf('\n',startIndex+1);
		}
		innerTable.rows[4].cells[0].innerHTML += "<span style='color:blue;'>Character count = </span><span findme='biolength' style='color:blue;'>" +
			(textArea.value.length + crCount) + "</span><span style='color:blue;'>/</span><span findme='biototal' style='color:blue;'>255</span>";

		document.getElementById('biotext').addEventListener('keyup', Helper.updateBioCharacters, true);
		System.xmlhttp("index.php?cmd=points", Helper.getTotalBioCharacters);
	},

	injectShoutboxWidgets: function(textboxname, maxcharacters) {
		var textArea = System.findNode("//textarea[@name='" + textboxname + "']");
		textArea.setAttribute("findme", "Helper:InputText");
		textArea.setAttribute("maxcharacters", maxcharacters);
		var textAreaTable = System.findNode("../../../..", textArea);
		textAreaTable.insertRow(-1).insertCell(0).setAttribute("id", "Helper:ShoutboxPreview");
		textArea.addEventListener('keyup', Helper.updateShoutboxPreview, true);
	},

	updateShoutboxPreview: function(evt) {
		var textArea = System.findNode("//textarea[@findme='Helper:InputText']");
		var textContent = textArea.value;
		var chars = textContent.length;
		var maxchars = parseInt(textArea.getAttribute("maxcharacters"));
		if (chars>maxchars) {
			textContent=textContent.substring(0,maxchars);
			textArea.value=textContent;
			chars=maxchars;
		}

		document.
			getElementById("Helper:ShoutboxPreview")
			.innerHTML = '<table align="center" width="325" border="0"><tbody>' +
			'<tr><td style="text-align:center;color:#7D2252;background-color:#CD9E4B">Preview (' + chars + '/' + maxchars + ' characters)</td></tr>' +
			'<tr><td width="325"><span style="font-size:x-small;" findme="biopreview">' + textContent +
			'</span></td></tr></tbody></table>';

	},

	updateBioCharacters: function(evt) {
		var textArea = System.findNode("//textarea[@name='bio']");
		var characterCount = System.findNode("//span[@findme='biolength']");
		var crCount = 0;
		var startIndex = 0;
		while (textArea.value.indexOf('\n',startIndex+1) != -1) {
			crCount++;
			startIndex = textArea.value.indexOf('\n',startIndex+1);
		}
		characterCount.innerHTML = (textArea.value.length + crCount);
		var bioTotal = System.findNode("//span[@findme='biototal']");
		if ((characterCount.innerHTML*1) > (bioTotal.innerHTML*1)) {
			characterCount.style.color = "red";
		} else {
			characterCount.style.color = "blue";
		}
		var previewArea = System.findNode("//span[@findme='biopreview']");
		var bioPreviewHTML = System.convertTextToHtml(textArea.value);
		previewArea.innerHTML = bioPreviewHTML;
	},

	getTotalBioCharacters: function(responseText) {
		var doc=System.createDocument(responseText)
		var bioCharactersText = System.findNode("//td[.='+25 Bio Characters']",doc);
		var bioCharactersRatio = bioCharactersText.nextSibling.nextSibling.nextSibling.nextSibling;
		var bioCharactersValueRE = /(\d+) \/ 75/;
		var bioCharactersValue = bioCharactersValueRE.exec(bioCharactersRatio.innerHTML)[1]*1;
		var bioTotal = System.findNode("//span[@findme='biototal']");
		bioTotal.innerHTML = (bioCharactersValue * 25) + 255;
	},

	addHistoryWidgets: function() {
		var textArea = System.findNode("//textarea[@name='history']");
		if (!textArea) return;
		var textAreaTable = textArea.parentNode.parentNode.parentNode.parentNode;
		var bioPreviewHTML = System.convertTextToHtml(textArea.value);
		var newRow = textAreaTable.insertRow(-1);
		var newCell = newRow.insertCell(0);
		newCell.innerHTML = '<table align="center" width="325" border="1"><tbody>' +
			'<tr><td style="text-align:center;color:#7D2252;background-color:#CD9E4B">Preview</td></tr>' +
			'<tr><td width="325"><span style="font-size:small;" findme="biopreview">' + bioPreviewHTML +
			'</span></td></tr></tbody></table>';
		textArea.id = "historytext";
		var innerTable = System.findNode("//table[tbody/tr/td/font/b[.='Edit Guild History']]");
		var crCount = 0;
		var startIndex = 0;
		while (textArea.value.indexOf('\n',startIndex+1) != -1) {
			crCount++;
			startIndex = textArea.value.indexOf('\n',startIndex+1);
		}
		innerTable.rows[4].cells[0].innerHTML += "<span style='color:blue;'>Character count = </span><span findme='historylength' style='color:blue;'>" +
			(textArea.value.length + crCount) + "</span><span style='color:blue;'>/</span><span findme='historytotal' style='color:blue;'>255</span>";

		document.getElementById('historytext').addEventListener('keyup', Helper.updateHistoryCharacters, true);
		System.xmlhttp("index.php?cmd=points&subcmd=guildupgrades", Helper.getTotalHistoryCharacters);
	},

	updateHistoryCharacters: function(evt) {
		var textArea = System.findNode("//textarea[@name='history']");
		var characterCount = System.findNode("//span[@findme='historylength']");
		var crCount = 0;
		var startIndex = 0;
		while (textArea.value.indexOf('\n',startIndex+1) != -1) {
			crCount++;
			startIndex = textArea.value.indexOf('\n',startIndex+1);
		}
		characterCount.innerHTML = (textArea.value.length + crCount);
		var bioTotal = System.findNode("//span[@findme='historytotal']");
		if ((characterCount.innerHTML*1) > (bioTotal.innerHTML*1)) {
			characterCount.style.color = "red";
		} else {
			characterCount.style.color = "blue";
		}
		var previewArea = System.findNode("//span[@findme='biopreview']");
		var bioPreviewHTML = System.convertTextToHtml(textArea.value);
		previewArea.innerHTML = bioPreviewHTML;
	},

	getTotalHistoryCharacters: function(responseText) {
		var doc=System.createDocument(responseText)
		var historyCharactersText = System.findNode("//td[.='+20 History Characters']",doc);
		var historyCharactersRatio = historyCharactersText.nextSibling.nextSibling.nextSibling.nextSibling;
		var historyCharactersValueRE = /(\d+) \/ 250/;
		var historyCharactersValue = historyCharactersValueRE.exec(historyCharactersRatio.innerHTML)[1]*1;
		var historyTotal = System.findNode("//span[@findme='historytotal']");
		historyTotal.innerHTML = (historyCharactersValue * 20) + 255;
	},

	portalToStartArea: function() {
		if (window.confirm('Are you sure you with to use a special portal back to Krul Island?')) {
			var krulXCV = GM_getValue("krulXCV");
			if (krulXCV) {
				System.xmlhttp("index.php?cmd=settings&subcmd=fix&xcv=" + krulXCV, function() {window.location="index.php?cmd=world";})
			} else {
				window.alert("Please visit the preferences page to cache your Krul Portal link");
			}
		}
	},

	storePlayerUpgrades: function() {
		var alliesText = System.findNode("//td[.='+1 Max Allies']");
		var alliesRatio = alliesText.nextSibling.nextSibling.nextSibling.nextSibling;
		var alliesValueRE = /(\d+) \/ 115/;
		var alliesValue = alliesValueRE.exec(alliesRatio.innerHTML)[1]*1;
		GM_setValue("alliestotal",alliesValue+5);
		var enemiesText = System.findNode("//td[.='+1 Max Enemies']");
		var enemiesRatio = enemiesText.nextSibling.nextSibling.nextSibling.nextSibling;
		var enemiesValueRE = /(\d+) \/ 115/;
		var enemiesValue = enemiesValueRE.exec(enemiesRatio.innerHTML)[1]*1;
		GM_setValue("enemiestotal",enemiesValue+5);
	},

	injectTopRated: function() {
		var mainTable = System.findNode("//table[tbody/tr/td/font/b[.='Top 250 Players']]");
		var mainTitle = mainTable.rows[0].cells[0];
		mainTitle.innerHTML += '&nbsp<input id="findOnlinePlayers" type="button" value="Find Online Players" ' +
			'title="Fetch the online status of the top 250 players (warning ... takes a few seconds)." class="custombutton">';

		document.getElementById('findOnlinePlayers').addEventListener('click', Helper.findOnlinePlayers, true);
	},

	findOnlinePlayers: function() {
		var findPlayersButton = System.findNode("//input[@id='findOnlinePlayers']");
		findPlayersButton.style.display = "none";
		var topPlayerTable = System.findNode("//table[@width='500']");
		var lowestLevel = topPlayerTable.rows[topPlayerTable.rows.length-4].cells[3].textContent*1;
		GM_setValue("lowestLevelInTop250",lowestLevel);
		var guildsChecked = "";
		for (var i=0; i<topPlayerTable.rows.length; i++) {
			var aRow = topPlayerTable.rows[i];
			if (aRow.cells[1] && i!=0) {
				var playerTable = topPlayerTable.rows[i].cells[1].firstChild;
				var playerElement = playerTable.rows[0].cells[0];
				var playerGuildHref = playerElement.firstChild.getAttribute("href");
				var playerGuildName = playerElement.firstChild.firstChild.getAttribute("title");
				//GM_log(guildsChecked.indexOf(playerGuildName));
				//if we haven't already checked this guild, then go ahead and check it
				if (guildsChecked.search(playerGuildName) == -1) {
					//GM_log(i+"::"+playerGuildName + "::" + playerGuildHref + "::" + aRow.innerHTML + "::" + guildsChecked);
					System.xmlhttp(playerGuildHref, Helper.parseGuildOnline);
					//log current guild as checked.
					guildsChecked += ' ' + playerGuildName;
				}
			}
		}
	},

	parseGuildOnline: function(responseText) {
		var topPlayerTable = System.findNode("//table[@width='500']");
		var lowestLevel = GM_getValue("lowestLevelInTop250");
		var doc=System.createDocument(responseText);
		memberTable = System.findNode("//table[tbody/tr/td[.='Rank']]", doc);
		for (var i=0; i<memberTable.rows.length; i++) {
			aRow = memberTable.rows[i];
			if (aRow.cells[1] && i!= 0) {
				onlineStatus = aRow.cells[0].innerHTML;
				playerName = aRow.cells[1].firstChild.nextSibling.innerHTML;
				playerLevel = aRow.cells[2].textContent*1;
				if (playerLevel >= lowestLevel) { // don't bother looking if they are a low level
					//var playerInTopPlayerList = System.findNode("//a[.='" + playerName +"']", topPlayerTable); // didn't work so had to comprimise.
					var playerInTopPlayerList = System.findNode("//a[.='" + playerName +"']");
					var inTopPlayerTable = System.findNode("//table[@width='500' and contains(.,'" + playerName +"')]");
					if (playerInTopPlayerList && inTopPlayerTable) {
						insertHere = playerInTopPlayerList.parentNode;
						insertHere.innerHTML += '&nbsp' + onlineStatus;
					}
				}
			}
		}
	},

	injectArena: function() {
		arenaTable = System.findNode("//table[@width=620]/tbody/tr/td[contains(.,'Reward')]/table");
		var injectHere = System.findNode("//tr[td/input[@value='Setup Combat Moves...']]").previousSibling.previousSibling.firstChild;
		var hideMatchesForCompletedMoves = GM_getValue("hideMatchesForCompletedMoves")
		injectHere.innerHTML = '<input id="Helper:hideMatchesForCompletedMoves" type="checkbox"' +
				(hideMatchesForCompletedMoves?' checked':'') + '/>'+
				'<span style="color:blue;">&nbsp;Hide Matches for Completed Moves | Number of active arenas: ' + (arenaTable.rows.length-1) +
				'<div align=center><form id=Helper:arenaFilterForm onSubmit="javascript:return false;">' +
				'Min lvl:<input value="' + GM_getValue("arenaMinLvl", 1) + '" size=5 name="Helper.arenaMinLvl" id="Helper.arenaMinLvl" style=custominput/> ' +
				'Max lvl:<input value="' + GM_getValue("arenaMaxLvl", 1000) + '" size=5 name="Helper.arenaMaxLvl" id="Helper.arenaMaxLvl" style=custominput/> ' +
				'<input id="Helper:arenaFilter" class="custombutton" type="submit" value="Filter"/>' +
				'<input id="Helper:arenaFilterReset" class="custombutton" type="button" value="Reset"/></form></div>'+
				'</span>';
		document.getElementById("Helper:hideMatchesForCompletedMoves").addEventListener('click', Helper.hideMatchesForCompletedMoves, true);
		document.getElementById("Helper:arenaFilterReset").addEventListener('click', Helper.resetArenaFilter, true);
		document.getElementById("Helper:arenaFilterForm").addEventListener('submit', Helper.setArenaFilter, true);

		var arenaMoves = System.getValueJSON("arenaMoves");
		var hideArenaPrizes = GM_getValue("hideArenaPrizes");
		if (hideArenaPrizes) {
			var hideArenaPrizesArray = hideArenaPrizes.split(",");
		}
		var oldArenaMatches = System.getValueJSON("arenaMatches");
		if (!oldArenaMatches) {
			arenaMatches = new Array();
		} else {
			while (oldArenaMatches.length>1000)
			{
				oldArenaMatches.shift();
			}
			arenaMatches = oldArenaMatches;
		}
		var matchFound = false;
		var minLvl=GM_getValue('arenaMinLvl',1);
		var maxLvl=GM_getValue('arenaMaxLvl',1000);
		for (var i=1; i<arenaTable.rows.length; i++){
			var row = arenaTable.rows[i];

			matchFound = false;
			aMatch = new Object();
			var arenaIDRE = /#\s(\d+)/;
			var arenaID = arenaIDRE.exec(row.cells[0].textContent)[1]*1;
			if (oldArenaMatches){
				for (var k=0; k<oldArenaMatches.length; k++){
					if (oldArenaMatches[k].arenaID == arenaID) {
						matchFound = true;
						break;
					}
				}
			}
			if (!matchFound) {
				aMatch.arenaID = arenaID;
				aMatch.arenaJoinCostHTML = row.cells[2].innerHTML;
				aMatch.arenaSpecialsHTML = row.cells[4].innerHTML;
				if (row.cells[4].innerHTML.search("/pvp/specials_1.gif") != -1) {
					aMatch.arenaSpecials = true;
				} else {
					aMatch.arenaSpecials = false;
				}
				aMatch.arenaHellForgeHTML = row.cells[5].innerHTML;
				aMatch.arenaMaxEquipHTML = row.cells[6].innerHTML;
				aMatch.arenaRewardHTML = row.cells[7].innerHTML;
				arenaMatches.push(aMatch);
			}

			var prizeSRC = row.cells[7].firstChild.getAttribute("src");
			var maxEquipLevel = row.cells[6].textContent*1;
			if (hideMatchesForCompletedMoves && arenaMoves && prizeSRC && prizeSRC.search("/pvp/") != -1) {
				for (var j=0; j<arenaMoves.length; j++){
					var searchText = System.imageServer + "/pvp/" + arenaMoves[j].moveID+ ".gif";
					if (prizeSRC == searchText && arenaMoves[j].moveCount == 3){
						row.style.visibility = "hidden";
						row.style.display = "none";
						break;
					}
				}
			}
			if (prizeSRC && prizeSRC.search("/items/") != -1) {
				var prizeImgElement = row.cells[7].firstChild;
				var prizeOnmouseover = prizeImgElement.getAttribute("onmouseover");
				var itemIdRE = /ajaxLoadCustom\((\d+)/;
				var itemId = itemIdRE.exec(prizeOnmouseover)[1];
				prizeOnmouseover = prizeOnmouseover.replace(/""/,'"ItemId = '+itemId+'"');
				prizeImgElement.setAttribute("onmouseover", prizeOnmouseover);
				if (hideArenaPrizes) {
					for (var k=0; k<hideArenaPrizesArray.length; k++){
						var compareStr = System.imageServer + "/items/" + hideArenaPrizesArray[k] + ".gif";
						if (prizeSRC == compareStr) {
							row.style.visibility = "hidden";
							row.style.display = "none";
							break;
						}
					}
				}
			}
			if (!(maxEquipLevel >= minLvl && maxEquipLevel <= maxLvl)) {
				row.style.visibility = "hidden";
				row.style.display = "none";
			}

			if (!matchFound) {
				//color new matches since last visit
				row.style.backgroundColor = '#F5F298';
			}
		}
		System.setValueJSON("arenaMatches", arenaMatches);

		Helper.getArenaTable();
		Helper.addEventSortArena();
		if (GM_getValue("autoSortArenaList")) {
			Helper.sortArenaByHeader("");
		}
	},

	setArenaFilter: function() {
		var onlinePlayerMinLvl = document.getElementById("Helper.arenaMinLvl");
		var onlinePlayerMaxLvl = document.getElementById("Helper.arenaMaxLvl");
		if (onlinePlayerMinLvl.value == '') onlinePlayerMinLvl.value = '0';
		if (onlinePlayerMaxLvl.value == '') onlinePlayerMaxLvl.value = '1000';
		if (!isNaN(onlinePlayerMinLvl.value))
			GM_setValue("arenaMinLvl", parseInt(onlinePlayerMinLvl.value));
		if (!isNaN(onlinePlayerMaxLvl.value))
			GM_setValue("arenaMaxLvl", parseInt(onlinePlayerMaxLvl.value));
		Helper.sortAsc=!Helper.sortAsc;
		if (GM_getValue("autoSortArenaList")) {
			Helper.sortArenaByHeader("");
		} else {
			window.location = window.location;
		}
	},

	resetArenaFilter: function() {
		GM_setValue("arenaMinLvl", 1);
		document.getElementById("Helper.arenaMinLvl").value=1;
		GM_setValue("arenaMaxLvl", 1000);
		document.getElementById("Helper.arenaMaxLvl").value=1000;
		Helper.sortAsc=!Helper.sortAsc;
		if (GM_getValue("autoSortArenaList")) {
			Helper.sortArenaByHeader("");
		} else {
			window.location = window.location
		}
	},
	
	addEventSortArena: function() {
		var titleCells=System.findNodes("//td[@bgcolor='#cd9e4b']");
		for (var i=0; i<titleCells.length; i++) {
			var cell=titleCells[i];
			cell.innerHTML = cell.innerHTML.replace(/ \[/,"<br>[");
			if (cell.innerHTML.search("Max Equip Level") != -1
				|| cell.innerHTML.search("Join Cost") != -1
				|| cell.innerHTML.search("State") != -1
				|| cell.innerHTML.search("Specials") != -1
				|| cell.innerHTML.search("Hell Forge") != -1
				|| cell.innerHTML.search("Id") != -1
				) {
				cell.style.textDecoration="underline";
				cell.style.cursor="pointer";
				cell.innerHTML=cell.innerHTML.replace(/^&nbsp;/,"");
				cell.addEventListener('click', Helper.sortArena, true);
			}
		}
	},

	hideMatchesForCompletedMoves: function(evt) {
		GM_setValue("hideMatchesForCompletedMoves", evt.target.checked);
		window.location=window.location;
	},
	
	sortArena: function(evt) {
		Helper.sortArenaByHeader(evt.target.textContent.replace(/[ \s]/g,""));
	},
	
	getArenaTable: function() {
		var titleCell=System.findNode("//td[@bgcolor='#cd9e4b']");
		var parentTables=System.findNodes("ancestor::table", titleCell)
		var list=parentTables[parentTables.length-1];

		Helper.arenaRows = new Array();
		for (var i=1; i<list.rows.length; i++){
			var theRow=list.rows[i];
			Helper.arenaRows[i-1] = {
				'ArenaID': theRow.cells[0].textContent,
				'Players': theRow.cells[1].textContent,
				'JoinCost': theRow.cells[2].textContent.replace(/,/g,"")*1,
				'JoinCostHTML': theRow.cells[2].innerHTML,
				'State': theRow.cells[3].textContent,
				'Specials[?]': (theRow.cells[4].firstChild.getAttribute("src").search("/specials_1.gif") == -1? 1:0),
				'SpecialsHTML': theRow.cells[4].innerHTML,
				'HellForge[?]': (theRow.cells[5].firstChild.getAttribute("src").search("/specials_1.gif") == -1? 1:0),
				'HellForgeHTML': theRow.cells[5].innerHTML,
				'MaxEquipLevel': theRow.cells[6].textContent*1,
				'MaxEquipLevelHTML': theRow.cells[6].innerHTML,
				'Reward': theRow.cells[7].innerHTML,
				'Action': theRow.cells[8].innerHTML,
				'Visibility': theRow.style.visibility,
				'BackgroundColor': theRow.style.backgroundColor
			};
		}
	},

	sortArenaByHeader: function(headerClicked) {
		if (headerClicked=="") {
			headerClicked = GM_getValue("arenaSortBy");
			if (headerClicked == undefined) headerClicked="State";
		} else {
			GM_setValue("arenaSortBy", headerClicked);
		}
		if (headerClicked=="Id") headerClicked="ArenaID";

		if (Helper.sortAsc==undefined) {
			Helper.sortAsc=GM_getValue("arenaSortAsc");
			if (Helper.sortAsc==undefined) Helper.sortAsc=false;
		} else {
			if (Helper.sortBy && Helper.sortBy==headerClicked) {
				Helper.sortAsc=!Helper.sortAsc;
			}
		}
		GM_setValue("arenaSortAsc",Helper.sortAsc);
		Helper.sortBy=headerClicked;

		if (headerClicked=="Member" || headerClicked=="State") {
			Helper.arenaRows.sort(Helper.stringSort)
		}
		else {
			Helper.arenaRows.sort(Helper.numberSort)
		}
		
		var titleCell=System.findNode("//td[@bgcolor='#cd9e4b']");
		var parentTables=System.findNodes("ancestor::table", titleCell)
		var list=parentTables[parentTables.length-1];
		var result='<tr>' + list.rows[0].innerHTML + '</tr>'

		var minLvl=GM_getValue('arenaMinLvl',1);
		var maxLvl=GM_getValue('arenaMaxLvl',1000);
		for (var i=0; i<Helper.arenaRows.length; i++){
			var r = Helper.arenaRows[i];
			//var bgColor=((i % 2)==0)?'bgcolor="#e7c473"':'bgcolor="#e2b960"'
			var bgColor='bgcolor="'+r.BackgroundColor+'"';
			if (r.Action.search("View") != -1) {
				bgColor = 'bgcolor="#f5e2b3"';
			}
			if (r.Visibility!="hidden" && r.MaxEquipLevel >= minLvl && r.MaxEquipLevel <= maxLvl) {
				result += '<TR>'+
				'<TD '+bgColor+' style="border-bottom:1px solid #CD9E4B;">'+r.ArenaID+'</TD>'+
				'<TD '+bgColor+' align="center" style="border-bottom:1px solid #CD9E4B;">'+r.Players+'</TD>'+
				'<TD '+bgColor+' align="center" style="border-bottom:1px solid #CD9E4B;">'+r.JoinCostHTML+'</TD>'+
				'<TD '+bgColor+' align="center" style="border-bottom:1px solid #CD9E4B;">'+r.State+'</TD>'+
				'<TD '+bgColor+' align="center" style="border-bottom:1px solid #CD9E4B;">'+r.SpecialsHTML+'</TD>'+
				'<TD '+bgColor+' align="center" style="border-bottom:1px solid #CD9E4B;">'+r.HellForgeHTML+'</TD>'+
				'<TD '+bgColor+' align="center" style="border-bottom:1px solid #CD9E4B;">'+r.MaxEquipLevelHTML+'</TD>'+
				'<TD '+bgColor+' align="center" style="border-bottom:1px solid #CD9E4B;">'+r.Reward+'</TD>'+
				'<TD '+bgColor+' align="center" style="border-bottom:1px solid #CD9E4B;"><form method="post" action="index.php">'+r.Action+'</form></TD></TR>';
			}
		}
		//result+='<tr>' + list.rows[list.rows.length-1].innerHTML + '</tr>'

		list.innerHTML=result;
		
		Helper.addEventSortArena();
	},

	storeArenaMoves: function(){
        var arenaMoves = System.findNodes("//img[@vspace='4']");
		var moves = new Array();
        for (var i=1; i<arenaMoves.length; i++) {
            arenaMove = arenaMoves[i];
			aMove = new Object();
            var moveGifNumberRE = /(\d+).gif/;
            var moveGifNumber = moveGifNumberRE.exec(arenaMove.getAttribute("src"))[1];
            var moveCountRE = /<\/a><br>(\d)\&nbsp;\/\&nbsp;(\d)/;
            var moveCount = moveCountRE.exec(arenaMove.parentNode.parentNode.innerHTML);
            aMove.moveID = moveGifNumber;
			aMove.moveCount = moveCount[2];
            aMove.moveHREF = arenaMove.getAttribute("src");
			moves.push(aMove);
        }
		System.setValueJSON("arenaMoves", moves);
    },

	injectTournament: function() {
		var mainTable = System.findNode("//table[tbody/tr/td/a[.='Back to PvP Arena']]");
		var joinPage = System.findNode("//b[.='Your Tournament Stats']");
		var injectHere = mainTable.rows[4].cells[0];
		injectHere.align='center';

		var tournamentTitle = System.findNode("//b[contains(.,'Tournament #')]");
		var tournamentIDRE = /Tournament #(\d+)/;
		var tournamentID = tournamentIDRE.exec(tournamentTitle.innerHTML)[1]*1;
		var arenaMatches = System.getValueJSON("arenaMatches");
		if (!arenaMatches) return;
		for (var k=0; k<arenaMatches.length; k++){
			if (arenaMatches[k].arenaID == tournamentID && !arenaMatches[k].arenaHTML) {
				var tournamentHTML = '<table><tbody>'+
					'<tr bgcolor="#CD9E4B"><td>Join Cost</td><td>Specials</td><td>Hell Forge</td><td>Max Equip</td><td>Reward</td></tr>'+
					'<tr><td>'+arenaMatches[k].arenaJoinCostHTML+'</td><td>'+arenaMatches[k].arenaSpecialsHTML+
						'</td><td>'+arenaMatches[k].arenaHellForgeHTML+'</td><td>'+arenaMatches[k].arenaMaxEquipHTML+
						'</td><td>'+arenaMatches[k].arenaRewardHTML+'</td></tr>';
				if (arenaMatches[k].arenaSpecials && joinPage) {
					tournamentHTML+='<tr><td colspan=5><span id="Helper:combatMoves"></span></td></tr>';
					System.xmlhttp("index.php?cmd=arena&subcmd=setup", Helper.getCombatMoves);
				}
				tournamentHTML+='</tbody></table>';
				injectHere.innerHTML = tournamentHTML;
				break;
			}
		}
	},

	getCombatMoves: function(responseText, callback) {
        var doc=System.createDocument(responseText);
		var combatMovesTable = System.findNode("//table[@width='10']/..", doc);
		var injectHere = System.findNode("//span[@id='Helper:combatMoves']");
		injectHere.innerHTML = combatMovesTable.innerHTML
    },

	storeCompletedArenas: function() {
		//fix button class and add go to first and last
		var prevButton = System.findNode("//input[@value='<']");
		var nextButton = System.findNode("//input[@value='>']");
		if (prevButton) {
			prevButton.setAttribute("class", "custombutton");
			var startButton = document.createElement("input");
			startButton.setAttribute("type", "button");
			startButton.setAttribute("onclick", prevButton.getAttribute("onclick").replace(/\&page=[0-9]*/, "&page=1"));
			startButton.setAttribute("class", "custombutton");
			startButton.setAttribute("value", "<<");
			prevButton.parentNode.insertBefore(startButton,prevButton);
		};
		if (nextButton) {
			nextButton.setAttribute("class", "custombutton");
			var lastPageNode=System.findNode("//input[@value='Go']/../preceding-sibling::td");
			lastPage = lastPageNode.textContent.replace(/\D/g,"");
			var finishButton = document.createElement("input");
			finishButton.setAttribute("type", "button");
			finishButton.setAttribute("onclick", nextButton.getAttribute("onclick").replace(/\&page=[0-9]*/, "&page=" + lastPage));
			finishButton.setAttribute("class", "custombutton");
			finishButton.setAttribute("value", ">>");
			nextButton.parentNode.insertBefore(finishButton, nextButton.nextSibling);
		};

		arenaTable = System.findNode("//table[@width=620]/tbody/tr/td[contains(.,'Reward')]/table");

		var arenaMoves = System.getValueJSON("arenaMoves");
		var oldArenaMatches = System.getValueJSON("arenaMatches");
		if (!oldArenaMatches) {
			arenaMatches = new Array();
		} else {
			while (oldArenaMatches.length>1000)
			{
				oldArenaMatches.shift();
			}
			arenaMatches = oldArenaMatches;
		}
		var matchFound = false;

		for (var i=1; i<arenaTable.rows.length-1; i++){
			var row = arenaTable.rows[i];
			matchFound = false;
			aMatch = new Object();
			var arenaIDRE = /#\s(\d+)/;
			var arenaID = arenaIDRE.exec(row.cells[0].textContent)[1]*1;
			if (oldArenaMatches){
				for (var k=0; k<oldArenaMatches.length; k++){
					if (oldArenaMatches[k].arenaID == arenaID) {
						matchFound = true;
						break;
					}
				}
			}
			if (!matchFound) {
				aMatch.arenaID = arenaID;
				aMatch.arenaJoinCostHTML = row.cells[2].innerHTML;
				aMatch.arenaSpecialsHTML = row.cells[4].innerHTML;
				if (row.cells[4].innerHTML.search("/pvp/specials_1.gif") != -1) {
					aMatch.arenaSpecials = true;
				} else {
					aMatch.arenaSpecials = false;
				}
				aMatch.arenaHellForgeHTML = row.cells[5].innerHTML;
				aMatch.arenaMaxEquipHTML = row.cells[6].innerHTML;
				aMatch.arenaRewardHTML = row.cells[7].innerHTML;
				arenaMatches.push(aMatch);
			}
		}
		System.setValueJSON("arenaMatches", arenaMatches);
	},

	injectRelicList: function(){
		var relics = Data.relicList();
		var relicImages = System.findNodes("//img[contains(@src,'/relics/')]");
		var relicFound = false;
		for (var i=0; i<relicImages.length; i++){
			var relicImage = relicImages[i];
			var relicName = relicImage.parentNode.nextSibling.nextSibling.textContent.trim();
			relicFound = false;
			for (var j=0; j<relics.length; j++){
				var relic = relics[j];
				if (relicName == relic.Name.trim()){
					var onmouseoverText='Tip(\'' +
						'<span style=\\\'font-weight:bold; color:#FFF380;\\\'>' + relic.Name + '</span><br /><br />' +
						relic.Realm + '<br><br>' +
						relic.Comment + '\');'
					relicImage.setAttribute("onmouseover", onmouseoverText);
					relicFound = true;
					break;
				}
			}
			if (!relicFound) GM_log("Relic:'" + relicName + "' not found in data set");
		}
	},

	injectSettingsGuildData: function(guildType) {
		var result='';
		result += '<input name="guild' + guildType + '" size="60" value="' + GM_getValue("guild" + guildType) + '">'
		result += '<span style="cursor:pointer;text-decoration:none;" id="toggleShowGuild' + guildType + 'Message" linkto="showGuild' +
			guildType + 'Message"> &#x00bb;</span>'
		result += '<div id="showGuild' + guildType + 'Message" style="visibility:hidden;display:none">'
		result += '<input name="guild' + guildType + 'Message" size="60" value="' + GM_getValue("guild" + guildType + "Message") + '">'
		result += '</div>'
		return result;
	},

	injectSettings: function() {
		var lastCheck=new Date(parseInt(GM_getValue("lastVersionCheck")));
		var buffs=GM_getValue("huntingBuffs");
		var doNotKillList=GM_getValue("doNotKillList");
		var hideArenaPrizes=GM_getValue("hideArenaPrizes");

		var configData=
			'<form><table width="100%" cellspacing="0" cellpadding="5" border="0">' +
			'<tr><td colspan="2" height="1" bgcolor="#333333"></td></tr>' +
			'<tr><td colspan="2"><b>Fallen Sword Helper configuration</b></td></tr>' +
			'<tr><td colspan="2" align=center><input type="button" class="custombutton" value="Check for updates" id="Helper:CheckUpdate"></td></tr>'+
			'<tr><td colspan="2" align=center><span style="font-size:xx-small">(Current version: ' + GM_getValue("currentVersion") + ', Last check: ' + lastCheck.toFormatString("dd/MMM/yyyy HH:mm:ss") +
			')</span></td></tr>' +
			'<tr><td colspan="2" align=center>' +
			'<span style="font-weight:bold;">Visit the <a href="http://code.google.com/p/fallenswordhelper/">Fallen Sword Helper web site</a> ' +
			'for any suggestions, requests or bug reports</span></td></tr>' +
			'<tr><td colspan="2" align="left"><b>Social Preferences</b></td></tr>' +
			'<tr><td colspan="2" align="left">Enter guild names, seperated by commas</td></tr>' +
			'<tr><td>Own Guild</td><td>'+ Helper.injectSettingsGuildData("Self") + '</td></tr>' +
			'<tr><td>Friendly Guilds</td><td>'+ Helper.injectSettingsGuildData("Frnd") + '</td></tr>' +
			'<tr><td>Old Guilds</td><td>'+ Helper.injectSettingsGuildData("Past") + '</td></tr>' +
			'<tr><td>Enemy Guilds</td><td>'+ Helper.injectSettingsGuildData("Enmy") + '</td></tr>' +
			'<tr><td align="right">'+Layout.networkIcon()+'Show Guild Online List' + Helper.helpLink('Show Guild Online List', 'This will show the guild members online list on the right.') +
				':</td><td><input name="enableGuildOnlineList" type="checkbox" value="on"' + (GM_getValue("enableGuildOnlineList")?" checked":"") +
				'> <input name="guildOnlineRefreshTime" size="1" value="'+ GM_getValue("guildOnlineRefreshTime") + '" /> seconds refresh</td></tr>' +
			'<tr><td align="right">'+Layout.networkIcon()+'Show guild chat' + Helper.helpLink('Show guild chat', 'Display guild chat on the right') +
				'</td><td colspan="3"><input name="enableChat" type="checkbox" value="on"' + (GM_getValue("chatLines")>0?" checked":"") + '">' +
			    '&nbsp;Show <input name="chatLines" size="3" value="' + GM_getValue("chatLines") + '"> lines</td></tr>' +
			'<tr><td align="right">Chat top to bottom' + Helper.helpLink('Chat top to bottom', 'When selected, chat messages run from top (older) to bottom (newer), as in most chat programs. ' +
				'When not, messages run as they are in HCS\'s chat') + '</td><td><input name="chatTopToBottom" type="checkbox" value="on"' + (GM_getValue("chatTopToBottom")?" checked":"") + '></td></tr>' +
			'<tr><th colspan="2" align="left">Other preferences</th></tr>' +
			'<tr><td align="right">Quick Kill ' + Helper.helpLink('Quick Kill', 'This will kill monsters without opening a new page') +
				':</td><td><input name="quickKill" type="checkbox" value="on"' + (GM_getValue("quickKill")?" checked":"") + '>' +
				'</td></tr>' +
			'<tr><td align="right">Keep Combat Logs' + Helper.helpLink('Keep Combat Logs', 'Save combat logs to a temporary variable. '+
				'Press <u>Show logs</u> on the right to display and copy them') +
				':</td><td><input name="keepLogs" type="checkbox" value="on"' + (GM_getValue("keepLogs")?" checked":"") + '>' +
				'<input type="button" class="custombutton" value="Show Logs" id="Helper:ShowLogs"></td></tr>' +
			'<tr><td align="right">Show rank controls' + Helper.helpLink('Show rank controls', 'Show ranking controls for guild managemenet in member profile page - ' +
				'this works for guild founders only') +
				':</td><td><input name="showAdmin" type="checkbox" value="on"' + (GM_getValue("showAdmin")?" checked":"") + '></td></tr>' +
			'<tr><td align="right">Cleanup guild log' + Helper.helpLink('Dim Non Player Guild Log Messages', 'Any log messages not related to the ' +
				'current player will be dimmed (e.g. recall messages from guild store)') +
				':</td><td><input name="hideNonPlayerGuildLogMessages" type="checkbox" value="on"' + (GM_getValue("hideNonPlayerGuildLogMessages")?" checked":"") + '></td></td></tr>' +
			'<tr><td align="right">Disable Item Coloring' + Helper.helpLink('Disable Item Coloring', 'Disable the code that colors the item text based on the rarity of the item.') +
				':</td><td><input name="disableItemColoring" type="checkbox" value="on"' + (GM_getValue("disableItemColoring")?" checked":"") + '></td></tr>' +
			'<tr><td align="right">Enable Log Coloring' + Helper.helpLink('Enable Log Coloring', 'Three logs will be colored if this is enabled, Guild Chat, Guild Log and Player Log. ' +
				'It will show any new messages in yellow and anything 20 minutes old ones in brown.') +
				':</td><td><input name="enableLogColoring" type="checkbox" value="on"' + (GM_getValue("enableLogColoring")?" checked":"") + '></td></td></tr>' +
			'<tr><td align="right">Show Completed Quests' + Helper.helpLink('Show Completed Quests', 'This will show completed quests that have been hidden and will also show any ' +
				'quests you might have missed.') +
				':</td><td><input name="showCompletedQuests" type="checkbox" value="on"' + (GM_getValue("showCompletedQuests")?" checked":"") + '></td>' +
			'<tr><td align="right">Show Combat Log' + Helper.helpLink('Show Combat Log', 'This will show the combat log for each automatic battle below the monster list.') +
				':</td><td><input name="showCombatLog" type="checkbox" value="on"' + (GM_getValue("showCombatLog")?" checked":"") + '></td></tr>' +
			'<tr><td align="right">Color Special Creatures' + Helper.helpLink('Color Special Creatures', 'Creatures will be colored according to their rarity. ' +
				'Champions will be colored green, Elites yellow and Super Elites red.') +
				':</td><td><input name="enableCreatureColoring" type="checkbox" value="on"' + (GM_getValue("enableCreatureColoring")?" checked":"") + '></td></td></tr>' +
			'<tr><td align="right">'+Layout.networkIcon()+'Show Creature Info' + Helper.helpLink('Show Creature Info', 'This will show the information from the view creature link when you mouseover the link.' +
				((System.browserVersion<3)?'<br>Does not work in Firefox 2 - suggest disabling or upgrading to Firefox 3.':'')) +
				':</td><td><input name="showCreatureInfo" type="checkbox" value="on"' + (GM_getValue("showCreatureInfo")?" checked":"") + '></td></tr>' +
			'<tr><td align="right">Keep Creature Log' + Helper.helpLink('Keep Creature Log', 'This will show the creature log for each creature you see when you travel. This requires Show Creature Info enabled!') +
				':</td><td><input name="showMonsterLog" type="checkbox" value="on"' + (GM_getValue("showMonsterLog")?" checked":"") + '>'+
				'&nbsp;&nbsp;<input type="button" class="custombutton" value="Show" id="Helper:ShowMonsterLogs"></td></tr>' +
			'<tr><td align="right">Hide Krul Portal' + Helper.helpLink('Hide Krul Portal', 'This will hide the Krul portal on the world screen.') +
				':</td><td><input name="hideKrulPortal" type="checkbox" value="on"' + (GM_getValue("hideKrulPortal")?" checked":"") + '></td></tr>' +
			'<tr><td align="right">Footprints Color' + Helper.helpLink('Footprints Color', 'Changes the color of the footprints, useful if you can\\\'t see them in some maps') +
				':</td><td><input name="footprintsColor" size="12" value="'+ GM_getValue("footprintsColor") + '" /></td></tr>' +
			'<tr><td align="right">Show Send Gold' + Helper.helpLink('Show Gold on World Screen', 'This will show an icon below the world map to allow you to quickly send gold to a Friend.') +
				':</td><td><input name="sendGoldonWorld" type="checkbox" value="on"' + (GM_getValue("sendGoldonWorld")?" checked":"") + '>'+
				'Send <input name="goldAmount" size="15" value="'+ GM_getValue("goldAmount") + '" /> '+
				'gold to <input name="goldRecipient" size="15" value="'+ GM_getValue("goldRecipient") + '" />' +
				'</td></tr>' +
			'<tr><td align="right">Hide Top Banner' + Helper.helpLink('Hide Top Banner', 'Pretty simple ... it just hides the top banner') +
				':</td><td><input name="hideBanner" type="checkbox" value="on"' + (GM_getValue("hideBanner")?" checked":"") + '></td></tr>' +
			'<tr><td align="right">Move FS box' + Helper.helpLink('Move FallenSword Box', 'This will move the FS box to the left, under the menu, for better visibility (unless it is already hidden.') +
				':</td><td><input name="moveFSBox" type="checkbox" value="on"' + (GM_getValue("moveFSBox")?" checked":"") + '></td></tr>' +
			'<tr><td align="right">Hide \"New?\" box' + Helper.helpLink('Hide New? Box', 'This will hide the New? box, useful to gain some space if you have already read it.') +
				':</td><td><input name="hideNewBox" type="checkbox" value="on"' + (GM_getValue("hideNewBox")?" checked":"") + '></td></tr>' +
			'<tr><td align="right">Enable Bio Compressor' + Helper.helpLink('Enable Bio Compressor', 'This will compress long bios according to settings and provide a link to expand the compressed section.') +
				':</td><td><input name="enableBioCompressor" type="checkbox" value="on"' + (GM_getValue("enableBioCompressor")?" checked":"") +
				'> Max Compressed Characters:<input name="maxCompressedCharacters" size="1" value="'+ GM_getValue("maxCompressedCharacters") + '" />'+
				' Max Compressed Lines:<input name="maxCompressedLines" size="1" value="'+ GM_getValue("maxCompressedLines") + '" /></td></tr>' +
			'<tr><td align="right">Do Not Kill List' + Helper.helpLink('Do Not Kill List', 'List of creatures that will not be killed by quick kill. You must type the full name of each creature, ' +
				'separated by commas. Creature name will show up in red color on world screen and will not be killed by keyboard entry (but can still be killed by mouseclick). Quick kill must be '+
				'enabled for this function to work.') +
				':</td><td colspan="3"><input name="doNotKillList" size="60" value="'+ doNotKillList + '" /></td></tr>' +
			'<tr><td align="right">Auto Sort Arena List' + Helper.helpLink('Auto Sort Arena List', 'This will automatically sort the arena list based on your last preference for sort.') +
				':</td><td><input name="autoSortArenaList" type="checkbox" value="on"' + (GM_getValue("autoSortArenaList")?" checked":"") + '></td></tr>' +
			'<tr><td align="right">Hide Arena Prizes' + Helper.helpLink('Hide Arena Prizes', 'List of the itemIds of arena prizes that should not display on the arena screen ' +
				'separated by commas. To find the itemId you will have to view the source of the page or mouseover the item on the arena page.') +
				':</td><td colspan="3"><input name="hideArenaPrizes" size="60" value="'+ hideArenaPrizes + '" /></td></tr>' +
			'<tr><td align="right">Hunting Buffs' + Helper.helpLink('Hunting Buffs', 'Customize which buffs are designated as hunting buffs. You must type the full name of each buff, ' +
				'separated by commas. Use the checkbox to enable/disable them.') +
				':</td><td colspan="3"><input name="showHuntingBuffs" type="checkbox" value="on"' + (GM_getValue("showHuntingBuffs")?" checked":"") + '>' +
				'<input name="huntingBuffs" size="60" value="'+ buffs + '" /></td></tr>' +
			'<tr><td align="right">Hide Specific Quests' + Helper.helpLink('Hide Specific Quests', 'If enabled, this hides quests whose name matches the list (separated by commas). ' +
				'This works on Quest Manager and Quest Book.') +
				':</td><td colspan="3"><input name="hideQuests" type="checkbox" value="on"' + (GM_getValue("hideQuests")?" checked":"") + '>' +
				'<input name="hideQuestNames" size="60" value="'+ GM_getValue("hideQuestNames") + '" /></td></tr>' +
			'<tr><td align="right">Hide Specific Recipes' + Helper.helpLink('Hide Specific Recipes', 'If enabled, this hides recipes whose name matches the list (separated by commas). ' +
				'This works on Recipe Manager') +
				':</td><td colspan="3"><input name="hideRecipes" type="checkbox" value="on"' + (GM_getValue("hideRecipes")?" checked":"") + '>' +
				'<input name="hideRecipeNames" size="60" value="'+ GM_getValue("hideRecipeNames") + '" /></td></tr>' +
			//save button
			'<tr><td colspan="2" align=center><input type="button" class="custombutton" value="Save" id="Helper:SaveOptions"></td></tr>' +
			'<tr><td colspan="2" align=center>' +
			'<span style="font-size:xx-small">Fallen Sword Helper was coded by <a href="' + System.server + 'index.php?cmd=profile&player_id=1393340">Coccinella</a>, ' +
			'<a href="' + System.server + 'index.php?cmd=profile&player_id=1346893">Tangtop</a> and '+
			'<a href="' + System.server + 'index.php?cmd=profile&player_id=2536682">dkwizard</a> '+
			'with valuable contributions by <a href="' + System.server + 'index.php?cmd=profile&player_id=524660">Nabalac</a>, ' +
			'<a href="' + System.server + 'index.php?cmd=profile&player_id=1570854">jesiegel</a>, ' +
			'<a href="' + System.server + 'index.php?cmd=profile&player_id=37905">Ananasii</a></td></tr>' +
			'</table></form>';
		var insertHere = System.findNode("//table[@width='100%']");
		var newRow=insertHere.insertRow(insertHere.rows.length);
		var newCell=newRow.insertCell(0);
		newCell.colSpan=3;
		newCell.innerHTML=configData;
		// insertHere.insertBefore(configData, insertHere);
		document.getElementById('Helper:SaveOptions').addEventListener('click', Helper.saveConfig, true);
		document.getElementById('Helper:CheckUpdate').addEventListener('click', Helper.checkForUpdate, true);
		document.getElementById('Helper:ShowLogs').addEventListener('click', Helper.showLogs, true);
		document.getElementById('Helper:ShowMonsterLogs').addEventListener('click', Helper.showMonsterLogs, true);

		document.getElementById('toggleShowGuildSelfMessage').addEventListener('click', System.toggleVisibilty, true);
		document.getElementById('toggleShowGuildFrndMessage').addEventListener('click', System.toggleVisibilty, true);
		document.getElementById('toggleShowGuildPastMessage').addEventListener('click', System.toggleVisibilty, true);
		document.getElementById('toggleShowGuildEnmyMessage').addEventListener('click', System.toggleVisibilty, true);

		var krulButton = System.findNode('//input[@value="Instant Portal back to Krul Island"]');
		onClick = krulButton.getAttribute("onclick");
		//window.location='index.php?cmd=settings&subcmd=fix&xcv=3264968baaf287c67b0fab314280b163';
		krulXCVRE = /xcv=([a-z0-9]+)'/
		krulXCV = krulXCVRE.exec(onClick);
		if (krulXCV) GM_setValue("krulXCV",krulXCV[1]);

		var minGroupLevelTextField = System.findNode('//input[@name="min_group_level"]');
		if (minGroupLevelTextField) {
			var minGroupLevel = minGroupLevelTextField.value;
			GM_setValue("minGroupLevel",minGroupLevel);
		}
	},

	helpLink: function(title, text) {
		return ' [ ' +
			'<span style="text-decoration:underline;cursor:pointer;" onmouseover="Tip(\'' +
			'<span style=\\\'font-weight:bold; color:#FFF380;\\\'>' + title + '</span><br /><br />' +
			text + '\');">?</span>' +
			' ]'
	},

	saveConfig: function(evt) {
		var oForm=evt.target.form;
		var chatLines = System.findNode("//input[@name='chatLines']", oForm);
		var enableChat = System.findNode("//input[@name='enableChat']", oForm);
		var chatLinesValue = parseInt(chatLines.value);

		if (enableChat.checked && (isNaN(chatLinesValue) || chatLinesValue<=0)) {
			chatLines.value="10";
		}
		if (!enableChat.checked) {
			chatLines.value="0";
		}

		var guildOnlineRefreshTime = System.findNode("//input[@name='guildOnlineRefreshTime']", oForm);
		var guildOnlineRefreshTimeValue = guildOnlineRefreshTime.value*1;
		if (isNaN(guildOnlineRefreshTimeValue) || guildOnlineRefreshTimeValue<=0) {
			guildOnlineRefreshTime.value=15;
		}

		//bio compressor validation logic
		var maxCompressedCharacters = System.findNode("//input[@name='maxCompressedCharacters']", oForm);
		var maxCompressedCharactersValue = maxCompressedCharacters.value*1;
		if (isNaN(maxCompressedCharactersValue) || maxCompressedCharactersValue<=50) {
			maxCompressedCharacters.value=1500;
		}
		var maxCompressedLines = System.findNode("//input[@name='maxCompressedLines']", oForm);
		var maxCompressedLinesValue = maxCompressedLines.value*1;
		if (isNaN(maxCompressedLinesValue) || maxCompressedLinesValue<=1) {
			maxCompressedLines.value=25;
		}

		System.saveValueForm(oForm, "guildSelf");
		System.saveValueForm(oForm, "guildFrnd");
		System.saveValueForm(oForm, "guildPast");
		System.saveValueForm(oForm, "guildEnmy");
		System.saveValueForm(oForm, "guildSelfMessage");
		System.saveValueForm(oForm, "guildFrndMessage");
		System.saveValueForm(oForm, "guildPastMessage");
		System.saveValueForm(oForm, "guildEnmyMessage");
		System.saveValueForm(oForm, "chatLines");
		System.saveValueForm(oForm, "chatTopToBottom");
		System.saveValueForm(oForm, "showAdmin");
		System.saveValueForm(oForm, "disableItemColoring");
		System.saveValueForm(oForm, "enableLogColoring");
		System.saveValueForm(oForm, "enableCreatureColoring");
		System.saveValueForm(oForm, "showCompletedQuests");
		System.saveValueForm(oForm, "hideNonPlayerGuildLogMessages");
		System.saveValueForm(oForm, "hideBanner");
		System.saveValueForm(oForm, "showCombatLog");
		System.saveValueForm(oForm, "showMonsterLog");
		System.saveValueForm(oForm, "showCreatureInfo");
		System.saveValueForm(oForm, "keepLogs");
		System.saveValueForm(oForm, "enableGuildOnlineList");
		System.saveValueForm(oForm, "quickKill");
		System.saveValueForm(oForm, "huntingBuffs");
		System.saveValueForm(oForm, "showHuntingBuffs");
		System.saveValueForm(oForm, "moveFSBox");
		System.saveValueForm(oForm, "hideNewBox");
		System.saveValueForm(oForm, "hideKrulPortal");
		System.saveValueForm(oForm, "hideQuests");
		System.saveValueForm(oForm, "hideQuestNames");
		System.saveValueForm(oForm, "hideRecipes");
		System.saveValueForm(oForm, "hideRecipeNames");
		System.saveValueForm(oForm, "footprintsColor");
		System.saveValueForm(oForm, "guildOnlineRefreshTime");
		System.saveValueForm(oForm, "doNotKillList");
		System.saveValueForm(oForm, "enableBioCompressor");
		System.saveValueForm(oForm, "maxCompressedCharacters");
		System.saveValueForm(oForm, "maxCompressedLines");
		System.saveValueForm(oForm, "sendGoldonWorld");
		System.saveValueForm(oForm, "goldRecipient");
		System.saveValueForm(oForm, "goldAmount");
		System.saveValueForm(oForm, "hideArenaPrizes");
		System.saveValueForm(oForm, "autoSortArenaList");

		window.alert("FS Helper Settings Saved");
		window.location = window.location;
		return false;
	},

	showLogs: function(evt) {
		document.location=System.server + "index.php?cmd=notepad&subcmd=showlogs"
	},

	showMonsterLogs: function(evt) {
		document.location=System.server + "index.php?cmd=notepad&subcmd=monsterlog"
	},

	injectNotepadShowLogs: function() {
		var content = Layout.notebookContent();
		var combatLog = GM_getValue("CombatLog");
		content.innerHTML = '<div align="center"><textarea align="center" cols="80" rows="25" ' +
			'readonly style="background-color:white;font-family:Consolas,\"Lucida Console\",\"Courier New\",monospace;" id="Helper:CombatLog">' + combatLog + '</textarea></div>' +
			'<br /><br /><table width="100%"><tr>'+
			'<td colspan="2" align=center>' +
			'<input type="button" class="custombutton" value="Select All" id="Helper:CopyLog"></td>' +
			'<td colspan="2" align=center>' +
			'<input type="button" class="custombutton" value="Clear" id="Helper:ClearLog"></td>' +
			'</tr></table>';
		document.getElementById("Helper:CopyLog").addEventListener("click", Helper.notepadCopyLog, true);
		document.getElementById("Helper:ClearLog").addEventListener("click", Helper.notepadClearLog, true);
	},

	notepadCopyLog: function() {
		var combatLog=document.getElementById("Helper:CombatLog")
		combatLog.focus();
		combatLog.select();
	},

	notepadClearLog: function() {
		if (window.confirm("Are you sure you want to clear your log?")) {
			var combatLog=document.getElementById("Helper:CombatLog");
			GM_setValue("CombatLog", "");
			window.location = window.location;
		}
	},

	guildRelationship: function(txt) {
		var guildSelf = GM_getValue("guildSelf");
		var guildFrnd = GM_getValue("guildFrnd");
		var guildPast = GM_getValue("guildPast");
		var guildEnmy = GM_getValue("guildEnmy");
		if (!guildSelf) {
			guildSelf = "";
			GM_setValue("guildSelf", guildSelf);
		}
		if (!guildFrnd) {
			guildFrnd = "";
			GM_setValue("guildFrnd", guildFrnd);
		}
		if (!guildPast) {
			guildPast = "";
			GM_setValue("guildPast", guildPast);
		}
		if (!guildEnmy) {
			guildEnmy = "";
			GM_setValue("guildEnmy", guildEnmy);
		}
		guildSelf = guildSelf.toLowerCase().replace(/\s*,\s*/, ",").replace(/\s\s*/g, " ").split(",");
		guildFrnd = guildFrnd.toLowerCase().replace(/\s*,\s*/, ",").replace(/\s\s*/g, " ").split(",");
		guildPast = guildPast.toLowerCase().replace(/\s*,\s*/, ",").replace(/\s\s*/g, " ").split(",");
		guildEnmy = guildEnmy.toLowerCase().replace(/\s*,\s*/, ",").replace(/\s\s*/g, " ").split(",");
		txt = txt.toLowerCase().replace(/\s\s*/g, " ");
		if (guildSelf.indexOf(txt) != -1) return "self";
		if (guildFrnd.indexOf(txt) != -1) return "friendly";
		if (guildPast.indexOf(txt) != -1) return "old";
		if (guildEnmy.indexOf(txt) != -1) return "enemy";
		return "";
	},

	displayMiniMap: function() {
		var miniMap = document.getElementById("miniMap");
		if (!miniMap) {
			miniMap = document.createElement("div");
			miniMap.style.position = "absolute";
			miniMap.style.left = 0;
			miniMap.style.top = 0;
			miniMap.style.display = 'none';
			miniMap.id = "miniMap";
			miniMap.style.zIndex = '90';
			miniMap.style.filter = "alpha";
			miniMap.style.opacity = "0.9";

			var objBody = document.getElementsByTagName("body").item(0);
			objBody.insertBefore(miniMap, objBody.firstChild);
		}

		if (miniMap.style.display != "") {
			if (Helper.levelName == GM_getValue("miniMapName")) {
				miniMap.innerHTML = GM_getValue("miniMapSource");
				Helper.markPlayerOnMiniMap();
				miniMap.style.display = "";
			}
			else {
				System.xmlhttp("index.php?cmd=world&subcmd=map", Helper.loadMiniMap, true);
			}
		}
		else miniMap.style.display = "none";
	},

	loadMiniMap: function(responseText) {
		var size = 20;
		var miniMap = document.getElementById("miniMap");
		var docu = System.createDocument(responseText);
		var doc = '<table cellspacing="0" cellpadding="0" align="center">' + System.findNode("//table", docu).innerHTML + '</table>';
		doc = doc.replace(/ background=/g, '><img width=' + size + ' height=' + size + ' src=');
		// doc = doc.replace(/<[^>]*>(<center><[^>]*title="You are here")>/g, '$1 width=11 height=11>');
		//doc = doc.replace("<center></center>", "");
		doc = doc.replace(/<[^>]*title="You are here"[^>]*>/g, '');
		doc = doc.replace(/<table [^>]*><tbody><tr><td[^>]*><\/td><\/tr><\/tbody><\/table>/g,'');
		doc = doc.replace(/width="40"/g, 'width="' + size + '"').replace(/height="40"/g, 'height="' + size + '"');
		miniMap.innerHTML = doc;

		Helper.markPlayerOnMiniMap();
		miniMap.style.display = "";

		GM_setValue("miniMapName", Helper.levelName);
		GM_setValue("miniMapSource", doc);
	},

	markPlayerOnMiniMap: function() {
		var miniMap = document.getElementById("miniMap");
		var posit = Helper.position();
		if (!miniMap || !posit) return;
		var position = miniMap.firstChild.rows[posit.Y].cells[posit.X];
		var background = position.firstChild.src;
		position.innerHTML = '<center><img width=16 height=16 src="' + System.imageServer + '/skin/player_tile.gif" title="You are here"></center>';
		position.style.backgroundImage = 'url("' + background + '")';
		position.style.backgroundPosition = "center";
	},

	injectQuickLinkManager: function() {
		GM_addStyle('.HelperTextLink {color:black;font-size:x-small;cursor:pointer;}\n' +
			'.HelperTextLink:hover {text-decoration:underline;}\n');
		var quickLinks = System.getValueJSON("quickLinks");
		if (!quickLinks) quickLinks=[];
		Helper.quickLinks = quickLinks;
		Helper.tmpContent=Layout.notebookContent();
		Helper.generateQuickLinkTable();
	},

	generateQuickLinkTable: function() {
		var result='<table><tr><th>Name</th><th>URL</th>' +
			'<th>New [<span style="cursor:pointer; text-decoration:underline;" title="Open page in a new window">?</span>]</th><th>&nbsp;</th></tr>';
		for (var i=0;i<Helper.quickLinks.length;i++) {
			var newWindow = Helper.quickLinks[i].newWindow;
			result+='<td>' + Helper.quickLinks[i].name + '</td><td style="font-size:x-small;">' + Helper.quickLinks[i].url + '</td>';
			result+='<td style="font-size:x-small;" align=center>' + (newWindow?newWindow:"false") + '</td><td>';
			result+='[<span style="cursor:pointer; text-decoration:underline;" class=HelperTextLink quickLinkId="' + i + '" id="Helper:DeleteLink' + i + '">Del</span>]</td></tr>';
		}
		result +=
			'<tr><td><input size=8 type=textbox class=custominput id="Helper:LinkName"></td>' +
			'<td><input size=75 type=textbox class=custominput id="Helper:LinkUrl"></td>' +
			'<td align=center><input type=checkbox style="font-size:xx-small" class=custominput id="Helper:newWindow" /></td>' +
			'<td>[<span style="cursor:pointer; text-decoration:underline;" class=HelperTextLink id="Helper:AddLink">Add</span>]</td></tr>';
		Helper.tmpContent.innerHTML = result;
		for (var i=0;i<Helper.quickLinks.length;i++) {
			document.getElementById("Helper:DeleteLink" + i).addEventListener('click', Helper.deleteQuickLink, true);
		}
		document.getElementById("Helper:AddLink").addEventListener('click', Helper.addQuickLink, true);
		System.setValueJSON("quickLinks", Helper.quickLinks);
	},

	deleteQuickLink: function(evt) {
		// if (!window.confirm('Are you sure you want to delete this link?')) return;
		var quickLinkId = evt.target.getAttribute("quickLinkId")
		Helper.quickLinks.splice(quickLinkId, 1);
		Helper.generateQuickLinkTable();
	},

	addQuickLink: function(evt) {
		var quickLinkName = document.getElementById("Helper:LinkName").value;
		var quickLinkUrl = document.getElementById("Helper:LinkUrl").value;
		var quickLinkNewWindow = document.getElementById("Helper:newWindow").checked;
		Helper.quickLinks.push({"name": quickLinkName, "url": quickLinkUrl, "newWindow": quickLinkNewWindow});
		Helper.generateQuickLinkTable();
	},

	movePage: function(dir) {
		var dirButton = System.findNode("//input[@value='"+dir+"']");
		if (!dirButton) return;
		var url = dirButton.getAttribute("onClick");
		url = url.replace(/^[^']*'/m, "").replace(/\';$/m, "");
		window.location = url;
	},

	injectCreateAuctionTemplate: function() {
		if (window.location.search.search("inv_id") == -1) {
			var items = System.findNodes("//a[contains(@href,'index.php?cmd=auctionhouse&subcmd=create2')]");
			if (items) {
				for (var i = 0; i < items.length; i++) {
					var item = items[i];
					var itemStats = /ajaxLoadItem\((\d+), (\d+), (\d+), (\d+)/.exec(item.getAttribute("onmouseover"));
					if (itemStats) {
						itemId = itemStats[1];
						invId = itemStats[2];
						type = itemStats[3];
						pid = itemStats[4];
						var itemHref = item.getAttribute("href");
						var newHref = itemHref + '&item_id=' + itemId + '&type=' + type + '&pid=' + pid
						item.setAttribute("href",newHref);
					}
				}
			}
			return;
		}
		var auctionTable = System.findNode("//table[tbody/tr/td/a[@href='index.php?cmd=auctionhouse&subcmd=create']]");

		var bidEntryTable = auctionTable.rows[9].cells[0].firstChild.nextSibling;
		var itemStats = /inv_id=(\d+)&item_id=(\d+)&type=(\d+)&pid=(\d+)/.exec(window.location.search)
		if (itemStats) {
			var invId = itemStats[1];
			var itemId = itemStats[2];
			var type = itemStats[3];
			var pid = itemStats[4];
			//GM_log();
			var newCell = bidEntryTable.rows[0].insertCell(2);
			newCell.rowSpan = 5;
			newCell.innerHTML = '<img src="' + System.imageServer + '/items/' + itemId + 
				'.gif" onmouseover="ajaxLoadItem(' + itemId + ', ' + invId + ', ' + type + ', ' + pid + ', \'\');" border=0>';
		}

		var newRow = auctionTable.insertRow(10);
		var newCell = newRow.insertCell(0);
		newCell.colSpan = 2;
		newCell.align = "center";
		var table = System.getValueJSON("auctionTemplate");
		if (!table) {
			table = [
				{auctionLength:6,auctionCurrency:1,auctionMinBid:1,		auctionBuyNow:1,	isDefault:true}
			];
			System.setValueJSON("auctionTemplate", table);
		}

		var textResult = "<table cellspacing='0' cellpadding='0' bordercolor='#000000'" +
				" border='0' align='center' width='550' style='border-style: solid; border-width: 1px;'>" +
				"<tr><td bgcolor='#cd9e4b'><center>Auction Templates</center></td></tr>" +
				"<tr><td><table cellspacing='10' cellpadding='0' border='0' width='100%'>" +
				"<tr><th bgcolor='#cd9e4b'>Length</th><th bgcolor='#cd9e4b'>Currency</th>"+
				"<th bgcolor='#cd9e4b'>Min Bid</th><th bgcolor='#cd9e4b'>Buy Now</th>"+
				"<th></th></tr>";

		for (var i = 0; i < table.length; i++) {
			textResult += "<tr align='right'><td>"+Helper.getAuctionLength(table[i].auctionLength)+"</td>"+
				"<td>"+(table[i].auctionCurrency==0?"Gold":"FSP")+"</td>"+
				"<td>"+System.addCommas(table[i].auctionMinBid)+"</td>"+
				"<td>"+System.addCommas(table[i].auctionBuyNow)+"</td>"+
				"<td>[<span style='cursor:pointer; text-decoration:underline; color:blue;' "+
					"id='Helper:useAuctionTemplate" + i + "' auctionTemplateId=" + i +
					" auctionLength=" + table[i].auctionLength +
					" auctionCurrency=" + table[i].auctionCurrency +
					" auctionMinBid=" + table[i].auctionMinBid +
					" auctionBuyNow=" + table[i].auctionBuyNow +
					">apply</span>]";
				textResult += " [<span style='cursor:pointer; text-decoration:underline; color:blue;' "+
					"id='Helper:delAuctionTemplate" + i + "' auctionTemplateId=" + i +">del</span>]"
			textResult += "</td></tr>";
		}
		if (table.length<=10) {
			textResult += "<tr align='right'>"+
				"<td><select id='Helper:auctionLength'><option value='0' selected>1 Hour</option><option value='1' >2 Hours</option>"+
					"<option value='2' >4 Hours</option><option value='3' >8 Hours</option><option value='4' >12 Hours</option>"+
					"<option value='5' >24 Hours</option><option value='6' >48 Hours</option></select></td>"+
				"<td><select id='Helper:auctionCurrency'><option value='0' >Gold</option><option value='1' selected>FSP</option></select></td>"+
				"<td><input type='text' class='custominput' size='6' id='Helper:minBid'/></td>"+
				"<td><input type='text' class='custominput' size='6' id='Helper:buyNow'/></td>"+
				"<td>[<span style='cursor:pointer; text-decoration:underline; color:blue;' "+
					"id='Helper:saveAuctionTemplate'>save new template</span>]</td></tr>";

		}
		textResult += "</table></td></tr></table>";

		newCell.innerHTML = textResult;

		if (table.length<=10) document.getElementById("Helper:saveAuctionTemplate").addEventListener("click", Helper.saveAuctionTemplate, true);
		for (var i = 0; i < table.length; i++) {
			document.getElementById("Helper:useAuctionTemplate" + i).addEventListener("click", Helper.useAuctionTemplate, true);
			document.getElementById("Helper:delAuctionTemplate" + i).addEventListener("click", Helper.delAuctionTemplate, true);
		}
	},

	getAuctionLength: function(auctionLength) {
		if (auctionLength == 1) return '2 Hours';
		else if (auctionLength == 2) return '4 Hours';
		else if (auctionLength == 3) return '8 Hours';
		else if (auctionLength == 4) return '12 Hours';
		else if (auctionLength == 5) return '24 Hours';
		else if (auctionLength == 6) return '48 Hours';
		else return '1 Hour'
	},

	useAuctionTemplate: function(evt) {
		var newAuctionLength = evt.target.getAttribute("auctionLength");
		var newAuctionCurrency = evt.target.getAttribute("auctionCurrency");
		var newAuctionMinBid = evt.target.getAttribute("auctionMinBid");
		var newAuctionBuyNow = evt.target.getAttribute("auctionBuyNow");

		var auctionLength = System.findNode("//select[@name='auction_length']");
		var auctionCurrency = System.findNode("//select[@name='currency']");
		var auctionMinBid = System.findNode("//input[@name='minbid']");
		var auctionBuyNow = System.findNode("//input[@name='buynow']");

		auctionLength.selectedIndex = newAuctionLength;
		auctionCurrency.selectedIndex = newAuctionCurrency;
		auctionMinBid.value = newAuctionMinBid;
		auctionBuyNow.value = newAuctionBuyNow;
	},

	saveAuctionTemplate: function(evt) {
		var auctionLength = document.getElementById("Helper:auctionLength").value;
		var auctionCurrency = document.getElementById("Helper:auctionCurrency").value;
		var auctionMinBid = document.getElementById("Helper:minBid").value;
		var auctionBuyNow = document.getElementById("Helper:buyNow").value;
		if (!auctionMinBid) return;
		var table = System.getValueJSON("auctionTemplate");
		var theTemplate = {
			auctionLength: auctionLength,
			auctionCurrency: auctionCurrency,
			auctionMinBid: auctionMinBid,
			auctionBuyNow: auctionBuyNow,
			isDefault: false
		}
		table.push(theTemplate);
		System.setValueJSON("auctionTemplate", table);
		window.location = window.location;
	},

	delAuctionTemplate: function(evt) {
		var auctionTemplateId = evt.target.getAttribute("auctionTemplateId");
		var table = System.getValueJSON("auctionTemplate");
		table.splice(auctionTemplateId,1);
		System.setValueJSON("auctionTemplate", table);
		window.location = window.location;
	},

	injectMessageTemplate: function() {
		var injectHere = System.findNode("//input[@value='Send Message']/../../../../../../../../..");
		var table = System.getValueJSON("quickMsg");

		var targetPlayer = System.findNode("//input[@name='target_player']").value;
		if (!table) {
			table = ["Thank you very much ^_^", "Happy hunting, {playername}"];
			System.setValueJSON("quickMsg", table);
		}

		var textResult = "<br><table cellspacing='0' cellpadding='0' bordercolor='#000000'" +
				" border='0' align='center' width='550' style='border-style: solid; border-width: 1px;'>" +
				"<tr><td bgcolor='#cd9e4b'><center>Quick Message</center></td></tr>" +
				"<tr><td><table cellspacing='10' cellpadding='0' border='0' width='100%'>"

		for (var i = 0; i < table.length; i++) {
			textResult += "<tr><td>Msg " + (i+1) + " [<a onmouseover=\"Tip('Click on the message to append the template');\" href='#'>" +
				"<font color='white'>?</font></a>]:&nbsp;&nbsp;&nbsp;&nbsp;</td><td><span id='Helper.quickMsg" + i + "' quickMsgId=" + i + ">" +
				table[i].replace(/{playername}/g, targetPlayer) + "</span></td></tr>";
		}
		textResult += "<tr><td valign=top>Template: </td><td><textarea class=customtextarea rows=5 cols=40 id='Helper.quickMsgFullText'>" +
			JSON.stringify(table) + "</textarea></td></tr>" +
			"<tr><td align=center colspan=2><input class=custombutton type=button id='Helper.saveQuickMsg' value='Save Quick Message'></td></tr>" +
			"</table></td></tr></table>";

		var newNode = document.createElement("span");
		newNode.id = "spanQuickMsg";
		newNode.align = "center"
		newNode.innerHTML = textResult;
		injectHere.appendChild(newNode);

		document.getElementById("Helper.saveQuickMsg").addEventListener("click", Helper.saveQuickMsg, true);

		for (var i = 0; i < table.length; i++) {
			document.getElementById("Helper.quickMsg" + i).addEventListener("click", Helper.useQuickMsg, true);
		}
	},

	saveQuickMsg: function() {
		var quickMsg = document.getElementById("Helper.quickMsgFullText").value;
		try {
			JSON.parse(quickMsg);
		} catch (err) {
			alert("Not a valid template");
			return;
		}
		GM_setValue("quickMsg", quickMsg);
		var injectHere = System.findNode("//input[@value='Send Message']/../../../../../../../../..");
		injectHere.removeChild(document.getElementById("spanQuickMsg"));
		Helper.injectMessageTemplate();
	},

	useQuickMsg: function(evt) {
		var targetPlayer = System.findNode("//input[@name='target_player']").value;
		var quickMsgId = evt.target.getAttribute("quickMsgId");
		System.findNode("//textarea[@name='msg']").value +=
			System.getValueJSON("quickMsg")[quickMsgId].replace(/{playername}/g, targetPlayer) + "\n";
	},
	
	injectMailbox: function() {
		var items = System.findNodes("//a[contains(@href,'temp_id')]");
		if (items) {
			for (var i = 0; i < items.length; i++) {
				var item = items[i];
				var itemHref = item.getAttribute('href');
				var itemTable = item.parentNode.parentNode.parentNode.parentNode.parentNode;
				itemTable.innerHTML += '<br><span style="cursor:pointer; text-decoration:underline; color:blue; font-size:x-small;" '+
					'id="Helper:recallMailboxItem' + i + '" ' +
					'itemHref="' + itemHref + '">Fast Take</span>';
				document.getElementById('Helper:recallMailboxItem' + i)
					.addEventListener('click', Helper.recallMailboxItem, true);
			}
		}
	},

	recallMailboxItem: function(evt) {
		var mailboxItemHref = evt.target.getAttribute("itemHref");
		System.xmlhttp(mailboxItemHref,
			Helper.recallMailboxReturnMessage,
			{"target": evt.target});
	},

	recallMailboxReturnMessage: function(responseText, callback) {
		var target = callback.target;
		var info = Layout.infoBox(responseText);
		target.style.cursor = 'default';
		target.style.textDecoration = 'none';
		if (info.search("Item was transferred to your backpack") != -1) {
			target.style.color = 'green';
			target.style.fontWeight = 'bold';
			target.style.fontSize = 'small';
			target.innerHTML = "Taken";
		} else {
			target.style.color = 'red';
			target.style.fontWeight = 'bold';
			target.style.fontSize = 'small';
			target.innerHTML = "Error:" + info;
		}
	},
	
	injectAuctionQuickCancel: function() {
		if (location.search == '?cmd=auctionhouse' != -1 && location.search == '&type=-2' != -1) {
			var cancelButtons = System.findNodes("//img[@title='Cancel Auction']");
			if (cancelButtons) {
				for (var i = 0; i < cancelButtons.length; i++) {
					var cancelButton = cancelButtons[i];
					var cancelButtonHref = cancelButton.parentNode.getAttribute('href');
					var cancelButtonCellElement = cancelButton.parentNode.parentNode.parentNode;
					cancelButtonCellElement.style.textAlign = 'center';
					cancelButtonCellElement.innerHTML += '<br><br><span style="cursor:pointer; text-decoration:underline; color:blue; font-size:x-small;" '+
						'id="Helper:cancelAuctionItem' + i + '" ' +
						'cancelButtonHref="' + cancelButtonHref + '">Fast Cancel</span>';
					document.getElementById('Helper:cancelAuctionItem' + i)
						.addEventListener('click', Helper.cancelAuctionItem, true);
				}
			}
		}
	},

	cancelAuctionItem: function(evt) {
		var cancelButtonHref = evt.target.getAttribute("cancelButtonHref");
		System.xmlhttp(cancelButtonHref,
			Helper.cancelAuctionReturnMessage,
			{"target": evt.target});
	},

	cancelAuctionReturnMessage: function(responseText, callback) {
		var target = callback.target;
		var info = Layout.infoBox(responseText);
		target.style.cursor = 'default';
		target.style.textDecoration = 'none';
		if (info.search("You cancelled your auction") != -1) {
			target.style.color = 'green';
			target.style.fontWeight = 'bold';
			target.style.fontSize = 'small';
			target.innerHTML = "Cancelled";
		} else {
			target.style.color = 'red';
			target.style.fontWeight = 'bold';
			target.style.fontSize = 'small';
			target.innerHTML = "Error:" + info;
		}
	},
	
	injectPoints: function() {
		Helper.currentFSP = System.findNode("//tr[td/a/img[@src='"+System.imageServer+"/skin/icon_points.gif']]/td[4]").textContent.replace(/,/g,"")*1;
		
		var stamForFSPElement = System.findNode("//td[@width='60%' and contains(.,'+25 Current Stamina')]/../td[4]");
		var stamForFSPInjectHere = System.findNode("//td[@width='60%' and contains(.,'+25 Current Stamina')]");
		var stamFSPTextField = System.findNode("table/tbody/tr/td/input[@name='quantity']", stamForFSPElement);
		stamFSPTextField.type='current';
		stamFSPTextField.addEventListener('keyup', Helper.updateStamCount, true);
		stamForFSPInjectHere.innerHTML += ' <span style="color:blue" id="totalStam" type="current"><span>';

		var stamForFSPElement = System.findNode("//td[@width='60%' and contains(.,'+10 Maximum Stamina')]/../td[4]");
		var stamForFSPInjectHere = System.findNode("//td[@width='60%' and contains(.,'+10 Maximum Stamina')]");
		var stamFSPTextField = System.findNode("table/tbody/tr/td/input[@name='quantity']", stamForFSPElement);
		stamFSPTextField.type='maximum';
		stamFSPTextField.addEventListener('keyup', Helper.updateStamCount, true);
		stamForFSPInjectHere.innerHTML += ' <span style="color:blue" id="totalStam" type="maximum"><span>';
		
		var goldForFSPElement = System.findNode("//td[@width='60%' and contains(.,'+50,000')]/../td[4]");
		goldForFSPElement.innerHTML = '<a href="' + System.server + '?cmd=marketplace">Sell at Marketplace</a>';
	},
	
	updateStamCount: function(evt) {
		var FSPvalue = evt.target.value*1;
		var type = evt.target.getAttribute("type");
		var injectHere = System.findNode("//span[@id='totalStam' and @type='"+type+"']");
		//cap the value if the user goes over his current FSP
		var color = 'red';
		var extraStam = Helper.currentFSP*(type=='current'?25:10);
		if (FSPvalue <= Helper.currentFSP) {
			extraStam = FSPvalue*(type=='current'?25:10);
			color = 'blue';
		}
		injectHere.style.color = color;
		injectHere.innerHTML = '(+' + extraStam + ' stamina)';
	},
	
	injectTitan: function() {
		System.xmlhttp("index.php?cmd=guild&subcmd=scouttower", Helper.getScoutTowerDetails);
	},
	
	getScoutTowerDetails: function(responseText) {
		var doc=System.createDocument(responseText);
		var scoutTowerTable = System.findNode("//table[tbody/tr/td/img[@src='"+System.imageServer+"/skin/scouttower_header.jpg']]", doc);
		if (scoutTowerTable) {
			var titanTable = System.findNode("//table[tbody/tr/td/img[@src='"+System.imageServer+"/skin/titankilllog_banner.jpg']]");
			var newRow = titanTable.insertRow(-1);
			var newCell = newRow.insertCell(0);
			newCell.align = "center";
			newCell.innerHTML = "<span style='font-weight:bold; font-size:large; color:blue;'>Scout Tower Info</span>";
			
			var newRow = titanTable.insertRow(-1);
			var newCell = newRow.insertCell(0);
			newCell.innerHTML = scoutTowerTable.rows[8].cells[0].innerHTML;
		}
	},
	
	injectQuestTracker: function() {
		var injectHere = System.findNode("//td[font/b[.='Quest Details']]");
		
		var currentTrackedQuest = GM_getValue("questBeingTracked");
		if (currentTrackedQuest != location.search) {
			injectHere.innerHTML += '<br><input id="trackThisQuest" type="button" value="Track Quest" title="Tracks quest progress." class="custombutton">';
			document.getElementById("trackThisQuest").addEventListener("click", Helper.trackThisQuest, true);
		} else {
			injectHere.innerHTML += '<br><input id="dontTrackThisQuest" type="button" value="Stop Tracking Quest" title="Tracks quest progress." class="custombutton">';
			document.getElementById("dontTrackThisQuest").addEventListener("click", Helper.dontTrackThisQuest, true);
		}
	},
	
	trackThisQuest: function(evt) {
		GM_setValue("questBeingTracked", location.search);
		window.location = window.location;
	},

	dontTrackThisQuest: function(evt) {
		GM_setValue("questBeingTracked", "");
		window.location = window.location;
	},

	getQuestInfo: function(responseText) {
		var doc=System.createDocument(responseText);
		var questInfoElement = System.findNode("//span[@findme='questinfo']");
		var trackingHTMLElement = System.findNode("//font[@color='#003300']", doc);
		if (trackingHTMLElement) {
			questInfoElement.innerHTML = trackingHTMLElement.innerHTML;
		} else {
			questInfoElement.innerHTML = 'None';
		}
	}

};

Helper.onPageLoad(null);
