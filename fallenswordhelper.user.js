// ==UserScript==
// @name           FallenSwordHelper
// @namespace      terrasoft.gr
// @description    Fallen Sword Helper
// @include        http://www.fallensword.com/*
// @include        http://fallensword.com/*
// ==/UserScript==

var fsHelper = {
	// Static functions
	getValueJSON: function(name) {
		var resultJSON=GM_getValue(name);
		var result;
		if (resultJSON) {
			result = JSON.parse(resultJSON);
		}
		return result;
	},

	saveValueForm: function(oForm, name) {
		var formElement = fsHelper.findNode("//input[@name='" + name + "']", 0, oForm)
		if (formElement.getAttribute("type")=="checkbox") {
			GM_setValue(name, formElement.checked);
		} else {
			GM_setValue(name, formElement.value);
		}
	},

	findNode: function(xpath, index, doc) {
		var nodes=fsHelper.findNodes(xpath, doc);
		if (!nodes) return null;
		if (!index) index=0;
		return (nodes[index]);
	},

	findNodes: function(xpath, doc) {
			if (!doc) {
				doc=document;
			}
			var nodes=new Array();
			var findQ = document.evaluate(xpath, doc, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
			if (findQ.snapshotLength==0) return null;
			for (var i=0; i<findQ.snapshotLength; i++) {
				nodes.push(findQ.snapshotItem(i));
			}
			return nodes;
	},

	getImageServer: function() {
		var imgurls = fsHelper.findNode("//img[contains(@src, '/skin/')]");
		var idindex = imgurls.src.indexOf("/skin/");
		return imgurls.src.substr(0,idindex);
	},

	createDocument: function(details) {
		var doc=document.createElement("HTML");
		doc.innerHTML=details;
		return doc
	},

	// System functions
	init: function(e) {
		this.initialized = true;
		fsHelper.beginAutoUpdate();
	},

	// Autoupdate
	beginAutoUpdate: function() {
		var lastCheck=GM_getValue("lastVersionCheck")
		var now=(new Date()).getTime()
		if (!lastCheck) lastCheck=0;
		var haveToCheck=(now - lastCheck > 24*60*60*1000)

		if (haveToCheck) {
			fsHelper.checkForUpdate;
		}
	},

	checkForUpdate: function() {
		GM_log("Checking for new version...")
		var now=(new Date()).getTime();
		GM_setValue("lastVersionCheck", now.toString())
		GM_xmlhttpRequest({
			method: 'GET',
			url: "http://userscripts.org/scripts/versions/34343",
			headers: {
				"User-Agent" : navigator.userAgent,
				// "Content-Type": "application/x-www-form-urlencoded",
				"Cookie" : document.cookie
			},
			onload: function(responseDetails) {
				fsHelper.autoUpdate(responseDetails);
			},
		})
	},

	autoUpdate: function(responseDetails) {
		if (responseDetails.status!=200) return;
		var now=(new Date()).getTime()
		GM_setValue("lastVersionCheck", now.toString());
		var currentVersion=GM_getValue("currentVersion");
		if (!currentVersion) currentVersion=0;
		var versionRE=/\<h3\>\n\s*([0-9]+)\s*versions/;
		var latestVersion=responseDetails.responseText.match(versionRE)[1]
		GM_log("Current version:" + currentVersion);
		GM_log("Found version:" + latestVersion);
		if (currentVersion!=latestVersion) {
			if (window.confirm("New version (" + latestVersion + ") found. Update from version " + currentVersion + "?")) {
				GM_setValue("currentVersion", latestVersion)
				document.location="http://userscripts.org/scripts/source/34343.user.js";
			}
		}
	},

	hideBanner: function() {
		if (!GM_getValue("hideBanner")) return;
		var bannerElement = fsHelper.findNode("//img[(@title='Fallen Sword RPG')]");
		if (bannerElement) bannerElement.style.display = "none";
	},

	// main event dispatcher
	onPageLoad: function(anEvent) {
		fsHelper.init();
		fsHelper.hideBanner();
		fsHelper.prepareGuildList();

		var re=/cmd=([a-z]+)/;
		var pageIdRE = re.exec(document.location.search);
		var pageId="-";
		if (pageIdRE)
			pageId=pageIdRE[1];

		re=/subcmd=([a-z]+)/;
		var subPageIdRE = re.exec(document.location.search);
		var subPageId="-";
		if (subPageIdRE)
			subPageId=subPageIdRE[1];

		re=/subcmd2=([a-z]+)/;
		var subPage2IdRE = re.exec(document.location.search);
		var subPage2Id="-";
		if (subPage2IdRE)
			subPage2Id=subPage2IdRE[1];

		re=/page=([0-9]+)/;
		var subsequentPageIdRE = re.exec(document.location.search);
		var subsequentPageId="-";
		if (subsequentPageIdRE)
			subsequentPageId=subsequentPageIdRE[1];

		switch (pageId) {
		case "settings":
			fsHelper.injectSettings();
			break;
		case "world":
			fsHelper.injectWorld();
			break;
		case "questbook":
			switch(subsequentPageId) {
			case "-":
				fsHelper.injectQuestBook();
				break;
			}
			break;
		case "profile":
			switch (subPageId) {
			case "dropitems":
				fsHelper.injectDropItemsAuction();
				fsHelper.injectDropItems();
				break;
			default:
				fsHelper.injectProfile();
			}
			break;
		case "auctionhouse":
			switch (subPageId) {
			case "create":
				fsHelper.injectAuctionHouse();
				break;
			default:
				fsHelper.injectAuctionHouse();
			}
			break;
		case "guild":
			switch(subPageId) {
			case "inventory":
				switch(subPage2Id) {
					case "report":
						fsHelper.injectReportPaint();
						break;
					default:
						fsHelper.injectDropItemsAuction();
						fsHelper.injectDropItems();
				}
				break;
			case "chat":
				fsHelper.addLogColoring("Chat", 0);
				fsHelper.injectChat();
				break;
			case "log":
				fsHelper.addLogColoring("GuildLog", 1);
				break;
			case "groups":
				switch(subPage2Id) {
					case "viewstats":
						fsHelper.injectGroupStats();
						break;
					default:
						fsHelper.injectGroups();
				}
				break;
			case "manage":
				fsHelper.hideGuildInfo();
				break;
			}
			break;
		case "bank":
			fsHelper.injectBank();
			break;
		case "log":
			fsHelper.addLogColoring("PlayerLog", 1);
			fsHelper.addLogWidgets();
			break;
		case "-":
			var isRelicPage = fsHelper.findNode("//input[contains(@title,'Use your current group to capture the relic')]");
			if (isRelicPage) {
				fsHelper.injectRelic(isRelicPage);
			}
			break;
		}
	},

	hideGuildInfo: function() {
		if (!GM_getValue("hideGuildInfo")) return;
		fsHelper.hideGuildAvatar();
		fsHelper.hideGuildStatistics();
		fsHelper.hideGuildStructures();
	},

	injectRelic: function(isRelicPage) {
		var relicNameElement = fsHelper.findNode("//td[contains(.,'Below is the current status for the relic')]/b");
		relicNameElement.parentNode.style.fontSize = "x-small";
		var tableElement = fsHelper.findNode("//table[@width='600']");
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
		var tableWithBorderElement = fsHelper.findNode("//table[@cellpadding='5']");
		tableWithBorderElement.align = "left";
		tableWithBorderElement.parentNode.colSpan = "2";
		var tableInsertPoint = tableWithBorderElement.parentNode.parentNode;
		tableInsertPoint.innerHTML += "<td colspan='1'><table width='200' style='border-style:solid; border-width:1px; border-color: #A07720;'><tbody><tr><td title='InsertSpot'></td></tr></tbody></table></td>";
		var extraTextInsertPoint = fsHelper.findNode("//td[@title='InsertSpot']");
		var defendingGuild = fsHelper.findNode("//a[contains(@href,'index.php?cmd=guild&subcmd=view&guild_id=')]");
		var defendingGuildHref = defendingGuild.getAttribute("href");
		fsHelper.getRelicGuildData(extraTextInsertPoint,defendingGuildHref);

		//code specifically to see if guild members are guarding the relic - only applies to PANIC
		if (defendingGuildHref == "index.php?cmd=guild&subcmd=view&guild_id=40769") {
			var panicGuild = true;
		}
		var validMemberString = "";
		if (panicGuild) {
			var memberList = fsHelper.getValueJSON("memberlist");
			for (var i=0;i<memberList.members.length;i++) {
				var member=memberList.members[i];
				if (member.status == "Offline" && (member.level < 400 || member.level > 421)) {
					validMemberString += member.name + " ";
				}
			}
		}

		var listOfDefenders = fsHelper.findNodes("//b/a[contains(@href,'index.php?cmd=profile&player_id=')]");
		var defenderCount = 0;
		var testList = "";
		for (var i=0; i<listOfDefenders.length; i++) {
			var href = listOfDefenders[i].getAttribute("href");
			//if (i<3) { //I put this in to limit the number of calls this function makes.
					//I don't want to hammer the server too much.
				fsHelper.getRelicPlayerData(defenderCount,extraTextInsertPoint,href);
			//}
			testList += listOfDefenders[i].innerHTML + " ";
			validMemberString = validMemberString.replace(listOfDefenders[i].innerHTML + " ","");
			defenderCount++;
		}
		//extraTextInsertPoint.innerHTML += "<tr><td style='font-size:x-small;'>" + testList + "<td><tr>";
		extraTextInsertPoint.innerHTML += "<tr><td><table style='font-size:small; border-top:2px black solid;'>" +
			"<tr><td>Number of Defenders:</td><td>" + defenderCount + "</td></tr>" +
			"<tr><td>Defending Guild Relic Count:</td><td title='relicCount'>0</td></tr>" +
			"<tr><td>Lead Defender Bonus:</td><td title='LDPercentage'>0</td></tr>" +
			"<tr style='display:none;'><td>Relic Count Processed:</td><td title='relicProcessed'>0</td></tr>" +
			"<tr><td colspan='2' style='font-size:x-small; color:gray;'>Does not allow for last logged time (yet)</td></tr>" +
			"<tr style='display:none;><td colspan='2' style='border-top:2px black solid;'>Lead Defender Full Stats</td></tr>" +
			"<tr style='display:none;><td align='right' style='color:brown;'>Attack:</td><td align='right' title='LDattackValue'>0</td></tr>" +
			"<tr style='display:none;><td align='right' style='color:brown;'>Defense:</td><td align='right' title='LDdefenseValue'>0</td></tr>" +
			"<tr style='display:none;><td align='right' style='color:brown;'>Armor:</td><td align='right' title='LDarmorValue'>0</td></tr>" +
			"<tr style='display:none;><td align='right' style='color:brown;'>Damage:</td><td align='right' title='LDdamageValue'>0</td></tr>" +
			"<tr style='display:none;><td align='right' style='color:brown;'>HP:</td><td align='right' title='LDhpValue'>0</td></tr>" +
			"<tr style='display:none;><td align='right' style='color:brown;'>Processed:</td><td align='right' title='LDProcessed'>0</td></tr>" +
			"<tr><td colspan='2' style='border-top:2px black solid;'>Other Defender Stats</td></tr>" +
			"<tr><td align='right' style='color:brown;'>Attack:</td><td align='right' title='attackValue'>0</td></tr>" +
			"<tr><td align='right' style='color:brown;'>Defense:</td><td align='right' title='defenseValue'>0</td></tr>" +
			"<tr><td align='right' style='color:brown;'>Armor:</td><td align='right' title='armorValue'>0</td></tr>" +
			"<tr><td align='right' style='color:brown;'>Damage:</td><td align='right' title='damageValue'>0</td></tr>" +
			"<tr><td align='right' style='color:brown;'>HP:</td><td align='right' title='hpValue'>0</td></tr>" +
			"<tr><td align='right' style='color:brown;'>Processed:</td><td align='right' title='defendersProcessed'>0</td></tr>"
		if (panicGuild) {
			extraTextInsertPoint.innerHTML += "<tr><td style='border-top:2px black solid;'>Offline guild members not at relic:<td><tr>";
			extraTextInsertPoint.innerHTML += "<tr><td style='font-size:x-small; color:red;'>" + validMemberString + "<td><tr>";
		}
		extraTextInsertPoint.innerHTML += "</table><td><tr>";
	},

	getRelicGuildData: function(extraTextInsertPoint,href) {
		GM_xmlhttpRequest({
			method: 'GET',
			url: "http://www.fallensword.com/" + href,
			headers: {
				"User-Agent" : navigator.userAgent,
				"Content-Type": "application/x-www-form-urlencoded",
				"Cookie" : document.cookie
			},
			onload: function(responseDetails) {
				//GM_log(href);
				fsHelper.parseRelicGuildData(extraTextInsertPoint,href, responseDetails.responseText);
			},
		})
	},

	parseRelicGuildData: function(extraTextInsertPoint,href, responseText) {
		var doc=fsHelper.createDocument(responseText);
		var allItems = doc.getElementsByTagName("IMG");
		var relicCount = 0;
		for (var i=0;i<allItems.length-1;i++) {
			var anItem=allItems[i];
			var mouseoverText = anItem.getAttribute("onmouseover")
			if (mouseoverText && mouseoverText.search("Relic Bonuses") != -1){
				//GM_log(mouseoverText);
				relicCount++;
			}
		}
		var relicCountValue = fsHelper.findNode("//td[@title='relicCount']");
		relicCountValue.innerHTML = relicCount;
		var relicProcessedValue = fsHelper.findNode("//td[@title='relicProcessed']");
		relicProcessedValue.innerHTML = 1;
		var relicMultiplier = 1;
		if (relicCount == 1) {
			relicMultiplier = 1.5;
		}
		else if (relicCount > 3) {
			relicMultiplier = 0.9;
		}
		var LDProcessedValue = fsHelper.findNode("//td[@title='LDProcessed']");
		if (LDProcessedValue.innerHTML == "1") {
			var attackValue = fsHelper.findNode("//td[@title='attackValue']");
			var LDattackValue = fsHelper.findNode("//td[@title='LDattackValue']");
			attackNumber=attackValue.innerHTML.replace(/,/,"")*1;
			LDattackNumber=LDattackValue.innerHTML.replace(/,/,"")*1;
			attackValue.innerHTML = fsHelper.addCommas(attackNumber + Math.round(LDattackNumber*relicMultiplier));
			var defenseValue = fsHelper.findNode("//td[@title='defenseValue']");
			var LDdefenseValue = fsHelper.findNode("//td[@title='LDdefenseValue']");
			defenseNumber=defenseValue.innerHTML.replace(/,/,"")*1;
			LDdefenseNumber=LDdefenseValue.innerHTML.replace(/,/,"")*1;
			defenseValue.innerHTML = fsHelper.addCommas(defenseNumber + Math.round(LDdefenseNumber*relicMultiplier));
			var armorValue = fsHelper.findNode("//td[@title='armorValue']");
			var LDarmorValue = fsHelper.findNode("//td[@title='LDarmorValue']");
			armorNumber=armorValue.innerHTML.replace(/,/,"")*1;
			LDarmorNumber=LDarmorValue.innerHTML.replace(/,/,"")*1;
			armorValue.innerHTML = fsHelper.addCommas(armorNumber + Math.round(LDarmorNumber*relicMultiplier));
			var damageValue = fsHelper.findNode("//td[@title='damageValue']");
			var LDdamageValue = fsHelper.findNode("//td[@title='LDdamageValue']");
			damageNumber=damageValue.innerHTML.replace(/,/,"")*1;
			LDdamageNumber=LDdamageValue.innerHTML.replace(/,/,"")*1;
			damageValue.innerHTML = fsHelper.addCommas(damageNumber + Math.round(LDdamageNumber*relicMultiplier));
			var hpValue = fsHelper.findNode("//td[@title='hpValue']");
			var LDhpValue = fsHelper.findNode("//td[@title='LDhpValue']");
			hpNumber=hpValue.innerHTML.replace(/,/,"")*1;
			LDhpNumber=LDhpValue.innerHTML.replace(/,/,"")*1;
			hpValue.innerHTML = fsHelper.addCommas(hpNumber + Math.round(LDhpNumber*relicMultiplier));
			var defendersProcessed = fsHelper.findNode("//td[@title='defendersProcessed']");
			defendersProcessedNumber=defendersProcessed.innerHTML.replace(/,/,"")*1;
			defendersProcessed.innerHTML = fsHelper.addCommas(defendersProcessedNumber + 1);
			var LDpercentageValue = fsHelper.findNode("//td[@title='LDPercentage']");
			LDpercentageValue.innerHTML = (relicMultiplier*100) + "%";
		}
	},

	getRelicPlayerData: function(defenderCount,extraTextInsertPoint,href) {
		GM_xmlhttpRequest({
			method: 'GET',
			url: "http://www.fallensword.com/" + href,
			headers: {
				"User-Agent" : navigator.userAgent,
				"Content-Type": "application/x-www-form-urlencoded",
				"Cookie" : document.cookie
			},
			onload: function(responseDetails) {
				//window.alert(href);
				fsHelper.parseRelicPlayerData(defenderCount,extraTextInsertPoint,href, responseDetails.responseText);
			},
		})
	},

	parseRelicPlayerData: function(defenderCount,extraTextInsertPoint,href, responseText) {
		var doc=fsHelper.createDocument(responseText)
		var allItems = doc.getElementsByTagName("B")
		for (var i=0;i<allItems.length;i++) {
			var anItem=allItems[i];
			if (anItem.innerHTML == "Attack:&nbsp;"){
				var attackText = anItem;
				var attackLocation = attackText.parentNode.nextSibling.firstChild.firstChild.firstChild.firstChild;
				var playerAttackValue = attackLocation.textContent;
				var defenseText = attackText.parentNode.nextSibling.nextSibling.nextSibling.firstChild;
				var defenseLocation = defenseText.parentNode.nextSibling.firstChild.firstChild.firstChild.firstChild;
				var playerDefenseValue = defenseLocation.textContent;
				var armorText = defenseText.parentNode.parentNode.nextSibling.nextSibling.firstChild.nextSibling.firstChild;
				var armorLocation = armorText.parentNode.nextSibling.firstChild.firstChild.firstChild.firstChild;
				var playerArmorValue = armorLocation.textContent;
				var damageText = armorText.parentNode.nextSibling.nextSibling.nextSibling.firstChild;
				var damageLocation = damageText.parentNode.nextSibling.firstChild.firstChild.firstChild.firstChild;
				var playerDamageValue = damageLocation.textContent;
				var hpText = damageText.parentNode.parentNode.nextSibling.nextSibling.firstChild.nextSibling.firstChild;
				var hpLocation = hpText.parentNode.nextSibling.firstChild.firstChild.firstChild.firstChild;
				var playerHPValue = hpLocation.textContent;
			}
		}

		if (defenderCount != 0) {
			var defenderMultiplier = 0.2;
			var attackValue = fsHelper.findNode("//td[@title='attackValue']");
			attackNumber=attackValue.innerHTML.replace(/,/,"")*1;
			attackValue.innerHTML = fsHelper.addCommas(attackNumber + Math.round(playerAttackValue*defenderMultiplier));
			var defenseValue = fsHelper.findNode("//td[@title='defenseValue']");
			defenseNumber=defenseValue.innerHTML.replace(/,/,"")*1;
			defenseValue.innerHTML = fsHelper.addCommas(defenseNumber + Math.round(playerDefenseValue*defenderMultiplier));
			var armorValue = fsHelper.findNode("//td[@title='armorValue']");
			armorNumber=armorValue.innerHTML.replace(/,/,"")*1;
			armorValue.innerHTML = fsHelper.addCommas(armorNumber + Math.round(playerArmorValue*defenderMultiplier));
			var damageValue = fsHelper.findNode("//td[@title='damageValue']");
			damageNumber=damageValue.innerHTML.replace(/,/,"")*1;
			damageValue.innerHTML = fsHelper.addCommas(damageNumber + Math.round(playerDamageValue*defenderMultiplier));
			var hpValue = fsHelper.findNode("//td[@title='hpValue']");
			hpNumber=hpValue.innerHTML.replace(/,/,"")*1;
			hpValue.innerHTML = fsHelper.addCommas(hpNumber + Math.round(playerHPValue*defenderMultiplier));
			var defendersProcessed = fsHelper.findNode("//td[@title='defendersProcessed']");
			defendersProcessedNumber=defendersProcessed.innerHTML.replace(/,/,"")*1;
			defendersProcessed.innerHTML = fsHelper.addCommas(defendersProcessedNumber + 1);
		}
		else {
			var defenderMultiplier = 1;
			var attackValue = fsHelper.findNode("//td[@title='LDattackValue']");
			attackNumber=attackValue.innerHTML.replace(/,/,"")*1;
			attackValue.innerHTML = fsHelper.addCommas(attackNumber + Math.round(playerAttackValue*defenderMultiplier));
			var defenseValue = fsHelper.findNode("//td[@title='LDdefenseValue']");
			defenseNumber=defenseValue.innerHTML.replace(/,/,"")*1;
			defenseValue.innerHTML = fsHelper.addCommas(defenseNumber + Math.round(playerDefenseValue*defenderMultiplier));
			var armorValue = fsHelper.findNode("//td[@title='LDarmorValue']");
			armorNumber=armorValue.innerHTML.replace(/,/,"")*1;
			armorValue.innerHTML = fsHelper.addCommas(armorNumber + Math.round(playerArmorValue*defenderMultiplier));
			var damageValue = fsHelper.findNode("//td[@title='LDdamageValue']");
			damageNumber=damageValue.innerHTML.replace(/,/,"")*1;
			damageValue.innerHTML = fsHelper.addCommas(damageNumber + Math.round(playerDamageValue*defenderMultiplier));
			var hpValue = fsHelper.findNode("//td[@title='LDhpValue']");
			hpNumber=hpValue.innerHTML.replace(/,/,"")*1;
			hpValue.innerHTML = fsHelper.addCommas(hpNumber + Math.round(playerHPValue*defenderMultiplier));
			var defendersProcessed = fsHelper.findNode("//td[@title='LDProcessed']");
			defendersProcessedNumber=defendersProcessed.innerHTML.replace(/,/,"")*1;
			defendersProcessed.innerHTML = fsHelper.addCommas(defendersProcessedNumber + 1);
		}
		var relicProcessedValue = fsHelper.findNode("//td[@title='relicProcessed']");
		var relicCountValue = fsHelper.findNode("//td[@title='relicProcessed']");
		var relicCount = relicCountValue.innerHTML.replace(/,/,"")*1;

		var relicMultiplier = 1;
		if (relicCount == 1) {
			relicMultiplier = 1.5;
		}
		else if (relicCount > 3) {
			relicMultiplier = 0.9;
		}

		//GM_log(defenderCount + ":" + relicProcessedValue.innerHTML);
		if (defenderCount == 0 && relicProcessedValue.innerHTML == "1") {
			var attackValue = fsHelper.findNode("//td[@title='attackValue']");
			var LDattackValue = fsHelper.findNode("//td[@title='LDattackValue']");
			attackNumber=attackValue.innerHTML.replace(/,/,"")*1;
			LDattackNumber=LDattackValue.innerHTML.replace(/,/,"")*1;
			attackValue.innerHTML = fsHelper.addCommas(attackNumber + Math.round(LDattackNumber*relicMultiplier));
			var defenseValue = fsHelper.findNode("//td[@title='defenseValue']");
			var LDdefenseValue = fsHelper.findNode("//td[@title='LDdefenseValue']");
			defenseNumber=defenseValue.innerHTML.replace(/,/,"")*1;
			LDdefenseNumber=LDdefenseValue.innerHTML.replace(/,/,"")*1;
			defenseValue.innerHTML = fsHelper.addCommas(defenseNumber + Math.round(LDdefenseNumber*relicMultiplier));
			var armorValue = fsHelper.findNode("//td[@title='armorValue']");
			var LDarmorValue = fsHelper.findNode("//td[@title='LDarmorValue']");
			armorNumber=armorValue.innerHTML.replace(/,/,"")*1;
			LDarmorNumber=LDarmorValue.innerHTML.replace(/,/,"")*1;
			armorValue.innerHTML = fsHelper.addCommas(armorNumber + Math.round(LDarmorNumber*relicMultiplier));
			var damageValue = fsHelper.findNode("//td[@title='damageValue']");
			var LDdamageValue = fsHelper.findNode("//td[@title='LDdamageValue']");
			damageNumber=damageValue.innerHTML.replace(/,/,"")*1;
			LDdamageNumber=LDdamageValue.innerHTML.replace(/,/,"")*1;
			damageValue.innerHTML = fsHelper.addCommas(damageNumber + Math.round(LDdamageNumber*relicMultiplier));
			var hpValue = fsHelper.findNode("//td[@title='hpValue']");
			var LDhpValue = fsHelper.findNode("//td[@title='LDhpValue']");
			hpNumber=hpValue.innerHTML.replace(/,/,"")*1;
			LDhpNumber=LDhpValue.innerHTML.replace(/,/,"")*1;
			hpValue.innerHTML = fsHelper.addCommas(hpNumber + Math.round(LDhpNumber*relicMultiplier));
			var defendersProcessed = fsHelper.findNode("//td[@title='defendersProcessed']");
			defendersProcessedNumber=defendersProcessed.innerHTML.replace(/,/,"")*1;
			defendersProcessed.innerHTML = fsHelper.addCommas(defendersProcessedNumber + 1);
			var LDpercentageValue = fsHelper.findNode("//td[@title='LDPercentage']");
			LDpercentageValue.innerHTML = (relicMultiplier*100) + "%";
		}
	},

	mapThis: function() {
		var realm = fsHelper.findNode("//td[contains(@background,'/skin/realm_top_b2.jpg')]/center/nobr/b");
		var posit = fsHelper.findNode("//td[contains(@background,'/skin/realm_top_b4.jpg')]/center/nobr/font");
		if ((realm) && (posit)>0) {
			var position=posit.innerHTML;
			var levelName=realm.innerHTML;
			var positionRE=/\((\d+),\s*(\d+)\)/
			var positionX = parseInt(position.match(positionRE)[1]);
			var positionY = parseInt(position.match(positionRE)[2]);
			var theMap = fsHelper.getValueJSON("map")
			GM_log(GM_getValue("map"))
			// theMap = null;
			if (!theMap) {
				theMap = new Object;
				theMap["levels"] = {};
			}
			if (!theMap["levels"][levelName]) theMap["levels"][levelName] = {};
			if (!theMap["levels"][levelName][positionX]) theMap["levels"][levelName][positionX]={};
			theMap["levels"][levelName][positionX][positionY]="!";
			GM_setValue("map", JSON.stringify(theMap));
		}
	},

	checkBuffs: function() {
		var replacementText = "<td colspan='7' height='5'>"
		replacementText += "<table cellpadding='1' style='font-size:medium; border-top:2px black solid; border-spacing: 1px; border-collapse: collapse;'>"
		replacementText += "<tr>";

		var hasShieldImp = fsHelper.findNode("//img[contains(@onmouseover,'Summon Shield Imp')]");
		var hasDeathDealer = fsHelper.findNode("//img[contains(@onmouseover,'Death Dealer')]");
		if (hasDeathDealer || hasShieldImp) {
			var re=/(\d) HP remaining/;
			var impsRemaining = 0;
			if (hasShieldImp) {
				//textToTest = "tt_setWidth(105); Tip('<center><b>Summon Shield Imp<br>2 HP remaining<br></b> (Level: 150)</b><br>[Click to De-Activate]</center>');";
				textToTest = hasShieldImp.getAttribute("onmouseover");
				impsRemainingRE = re.exec(textToTest);
				impsRemaining = impsRemainingRE[1];
			}
			var applyImpWarningColor = " style='color:green; style='font-size:small;'";
			if (impsRemaining<2){
				applyImpWarningColor = " style='color:red; style='font-size:medium;'";
			}
			replacementText += "<tr><td" + applyImpWarningColor + ">Shield Imps Remaining: " +  impsRemaining + "</td></tr>"
		}

		var hasDoubler = fsHelper.findNode("//img[contains(@onmouseover,'Doubler')]");
		var hasLibrarian = fsHelper.findNode("//img[contains(@onmouseover,'Librarian')]");
		var hasAdeptLearner = fsHelper.findNode("//img[contains(@onmouseover,'Adept Learner')]");
		var hasMerchant = fsHelper.findNode("//img[contains(@onmouseover,'Merchant')]");
		var hasTreasureHunter = fsHelper.findNode("//img[contains(@onmouseover,'Treasure Hunter')]");
		var hasAnimalMagnetism = fsHelper.findNode("//img[contains(@onmouseover,'Animal Magnetism')]");
		var hasConserve = fsHelper.findNode("//img[contains(@onmouseover,'Conserve')]");
		if (!hasDoubler || !hasLibrarian || !hasAdeptLearner || !hasMerchant || !hasTreasureHunter || !hasAnimalMagnetism || !hasConserve) {
			replacementText += "<tr><td style='font-size:x-small;'>You are missing some hunting buffs!" + "</td></tr>"
		}
		replacementText += "<td colspan='2'></td></tr>";
		replacementText += "</table>";
		replacementText += "</td>" ;

		var activeBuffsElement = fsHelper.findNode("//b[(.='Active Buffs')]");
		beforeActiveBuffsElement = activeBuffsElement.parentNode.parentNode.previousSibling.parentNode.previousSibling.previousSibling;
		beforeActiveBuffsElement.innerHTML = replacementText;
	},

	injectQuestBook: function() {
		if (GM_getValue("showCompletedQuests")) return;
		var questTable = fsHelper.findNode("//table[@width='100%' and @cellPadding='2']");
		questTable.setAttribute("title","questTable");
		var hideNextRows = 0;
		for (var i=0;i<questTable.rows.length;i++) {
			var aRow = questTable.rows[i];
			if (i!=0) {
				if (hideNextRows > 0) {
					aRow.style.display = "none";
					hideNextRows --;
				}
				if (aRow.cells[0].innerHTML) {
					var aCell = aRow.cells[0]
					var imgElement = aCell.nextSibling.firstChild;
					if (imgElement.getAttribute("title") == "Completed") {
						aRow.style.display = "none";
						hideNextRows = 3;
					}
				}
			}
			else {
				var questNameCell = aRow.firstChild.nextSibling;
				questNameCell.innerHTML += "&nbsp;&nbsp;<font style='color:blue;'>(Completed quests hidden - see preferences to unhide)</font>"
			}
		}

		var pageCountElement = fsHelper.findNode("//select[@class='customselect']");
		//&nbsp;of&nbsp;5&nbsp;
		var pageRE = /\&nbsp;of\&nbsp;(\d+)\&nbsp;/
		var pageCount=pageCountElement.parentNode.innerHTML.match(pageRE)[1]*1;
		for (var i=1;i<pageCount-1;i++) {
			var href = "http://www.fallensword.com/index.php?cmd=questbook&subcmd=&subcmd2=&page=" + i + "&search_text=";
			fsHelper.getQuestData(href);
		}
	},

	getQuestData: function(href) {
		GM_xmlhttpRequest({
			method: 'GET',
			url: href,
			headers: {
				"User-Agent" : navigator.userAgent,
				"Content-Type": "application/x-www-form-urlencoded",
				"Cookie" : document.cookie
			},
			onload: function(responseDetails) {
				fsHelper.injectQuestData(responseDetails.responseText);
			},
		})
	},

	injectQuestData: function(responseText) {
		var doc=fsHelper.createDocument(responseText)
		var allItems = doc.getElementsByTagName("TD");
		for (var i=0;i<allItems.length;i++) {
			var anItem=allItems[i];
			if (anItem.innerHTML=="Quest Name") {
				var questTable = anItem.parentNode.parentNode;
			}
		}
		var OriginalQuestTable = fsHelper.findNode("//table[@title='questTable']");
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
				var aCell = aRow.cells[0]
				var imgElement = aCell.nextSibling.firstChild;
				if (imgElement.getAttribute("title") != "Completed") {
					newRow = OriginalQuestTable.insertRow(OriginalQuestTable.rows.length);
					newRow.innerHTML = aRow.innerHTML;
					insertNextRows = 3;
				}
			}
		}
	},

	injectWorld: function() {
		// fsHelper.mapThis();
		var injectHere=fsHelper.findNode("//tr[contains(td/img/@src, 'realm_right_bottom.jpg')]").parentNode.parentNode
		var imgserver = fsHelper.getImageServer();
		var newRow=injectHere.insertRow(1);
		var newCell=newRow.insertCell(0);
		newCell.setAttribute("background", imgserver + "/skin/realm_right_bg.jpg");
		var killAll = GM_getValue("killAll");
		newCell.innerHTML="<div style='margin-left:28px;'><img id='fsHelperKillAll' src='" + imgserver + "/skin/" +
			(killAll?"quest_complete.gif":"quest_incomplete.gif") +
			"' />&nbsp;Automatically kill monsters</div>";
		document.getElementById('fsHelperKillAll').addEventListener('click', fsHelper.killAllToggleFromWorld, true);
		// injectHere.style.display='none';
		fsHelper.checkBuffs();
		fsHelper.killAllMonsters();
	},

	killAllToggleFromWorld: function(evt) {
		var killAll = GM_getValue("killAll");
		killAll = !killAll;
		var imgserver = fsHelper.getImageServer();
		evt.target.src=imgserver + "/skin/" + (killAll?"quest_complete.gif":"quest_incomplete.gif")
		GM_setValue("killAll", killAll);
		if (killAll) fsHelper.killAllMonsters();
	},

	killAllMonsters: function() {
		if (!GM_getValue("killAll")) return;
		var kills=0;
		for (var i=1; i<=8; i++) {
			var linkId="//a[@id='attackLink" + i + "']"
			var monster = fsHelper.findNode(linkId);
			if (monster) {
				kills+=1;
				var href=monster.href;
				GM_xmlhttpRequest({
					method: 'GET',
					callback: linkId,
					url: href,
					headers: {
						"User-Agent" : navigator.userAgent,
						// "Content-Type": "application/x-www-form-urlencoded",
						"Cookie" : document.cookie
					},
					onload: function(responseDetails, callback) {
						fsHelper.killedMonster(responseDetails, this.callback);
					},
				})
			}
		}
		if (kills>0) {
			GM_xmlhttpRequest({
				method: 'GET',
				url: "http://www.fallensword.com/index.php?cmd=blacksmith&subcmd=repairall&fromworld=1",
				headers: {
					"User-Agent" : navigator.userAgent,
					// "Content-Type": "application/x-www-form-urlencoded",
					"Cookie" : document.cookie
				},
				onload: function(responseDetails) {
					// GM_log(responseDetails.responseText);
				},
			})
		}
	},

	killedMonster: function(responseDetails, callback) {
		// GM_log(responseDetails.responseHeaders+"\n"+responseDetails.responseText);
		// GM_log(responseDetails.responseHeaders)
		// GM_log(responseDetails.responseText);
		// GM_log(callback);
		try {
			var reportRE=/var\s+report=new\s+Array;\n(report\[[0-9]+\]="[^"]+";\n)*/;
			// '"
			// GM_log(responseDetails.responseText.match(reportRE)[0]);

			var playerIdRE = /http:\/\/www.fallensword.com\/\?ref=(\d+)/
			var playerId=document.body.innerHTML.match(playerIdRE)[1];

			var xpGain=responseDetails.responseText.match(/var\s+xpGain=(-?[0-9]+);/)
			if (xpGain) {xpGain=xpGain[1]} else {xpGain=0};
			var goldGain=responseDetails.responseText.match(/var\s+goldGain=(-?[0-9]+);/)
			if (goldGain) {goldGain=goldGain[1]} else {goldGain=0};
			var guildTaxGain=responseDetails.responseText.match(/var\s+guildTaxGain=(-?[0-9]+);/)
			if (guildTaxGain) {guildTaxGain=guildTaxGain[1]} else {guildTaxGain=0};
			var lootRE=/You looted the item '<font color='(\#[0-9A-F]+)'>([^<]+)<\/font>'<\/b><br><br><img src=\"http:\/\/[0-9.]+\/items\/(\d+).gif\"\s+onmouseover="ajaxLoadCustom\([0-9]+,\s-1,\s+([0-9a-f]+),\s+[0-9]+,\s+''\);\">/
			// <b>You looted the item '<font color='#009900'>Shield of Votintown</font>'</b><br><br><img src="http://66.7.192.165/items/857.gif" onmouseover="ajaxLoadCustom(857, -1, d5b356b45146a64a7d322d48ff98b7cb, 1393340, '');"><br><br><font size=1>Note: Item stats may be higher due to crafting bonuses - check in your inventory.</font></div></td>
			// '"
			var infoRE=/<center>INFORMATION<\/center><\/font><\/td><\/tr>\t+<tr><td><font size=2 color=\"\#000000\"><center>([^<]+)<\/center>/i;
			var info=responseDetails.responseText.match(infoRE)
			if (info) {info=info[1]} else {info=""};
			var lootMatch=responseDetails.responseText.match(lootRE)
			var lootedItem = "";
			var lootedItemId = "";
			var lootedItemVerify="";
			if (lootMatch && lootMatch.length>0) {
				lootedItem=lootMatch[2];
				lootedItemId=lootMatch[3];
				lootedItemVerify=lootMatch[4];
				// GM_log(lootMatch);
				// GM_log(lootMatch[3]);
				// GM_log(lootMatch[4]);
			}

			var monster = fsHelper.findNode(callback);
			if (monster) {
				var resultText="<small><small>"+callback.replace(/\D/g,"")+". XP:" + xpGain + " Gold:" + goldGain + " (" + guildTaxGain + ")</small></small>";
				if (info!="") resultText+="<br/><div style='font-size:x-small;width:120px;overflow:hidden;' title='" + info + "'>" + info + "</div>";
				if (lootedItem!="") {
					// I've temporarily disabled the ajax thingie, as it doesn't seem to work anyway.
					resultText += "<br/><small><small>Looted item:<span onmouseoverDISABLED=\"ajaxLoadCustom(" + lootedItemId + ", -1, '" + lootedItemVerify + "', " + playerId + ", '');\" >" + lootedItem + "</span></small></small>"
				}
				monster.parentNode.innerHTML=resultText;
			}
		}
		catch (ex) {
			GM_log(ex);
			GM_log(responseDetails.responseText);
		}
	},

	prepareGuildList: function() {
		var injectHere = fsHelper.findNode("//table[@width='120' and contains(.,'New?')]")
		if (!injectHere) return;
		var info = injectHere.insertRow(0);
		var cell = info.insertCell(0);
		cell.innerHTML="<span id='fsHelperPlaceholderWorld'></span>";
		fsHelper.retrieveGuildData();
	},

	retrieveGuildData: function() {
		var memberList = fsHelper.getValueJSON("memberlist");
		if (memberList) {
			if ((new Date()).getTime() - memberList.changedOn > 15000) memberList = null; // invalidate cache
		}

		if (!memberList) {
			GM_xmlhttpRequest({
				method: 'GET',
				url: "http://www.fallensword.com/index.php?cmd=guild&subcmd=manage",
				headers: {
					"User-Agent" : navigator.userAgent,
					"Content-Type": "application/x-www-form-urlencoded",
					"Cookie" : document.cookie
				},
				onload: function(responseDetails) {
					fsHelper.parseGuildForWorld(responseDetails.responseText);
				},
			})
		} else {
			var memberList = fsHelper.getValueJSON("memberlist");
			memberList.isRefreshed = false;
			fsHelper.injectGuildList(memberList);
		}
	},

	parseGuildForWorld: function(details) {
		var doc=fsHelper.createDocument(details);
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
			var memberList = new Object();
			memberList.members = new Array();
			memberList.lookupByName = new Array();
			memberList.lookupById = new Array();
			for (var i=0;i<membersDetails.rows.length;i++) {
				var aRow = membersDetails.rows[i];
				if (aRow.cells.length==5 && aRow.cells[0].firstChild.title) {
					var aMember = new Object;
					aMember.status = aRow.cells[0].firstChild.title;
					aMember.id = (/[0-9]+$/).exec(aRow.cells[1].firstChild.nextSibling.href)[0]
					aMember.name=aRow.cells[1].firstChild.nextSibling.textContent;
					aMember.level=aRow.cells[2].textContent;
					aMember.rank=aRow.cells[3].textContent;
					aMember.xp=aRow.cells[4].textContent;
					memberList.members.push(aMember);
					memberList.lookupByName.push(aMember.name)
					memberList.lookupById.push(aMember.id)
				}
			}
			memberList.changedOn = new Date().getTime();
			memberList.isRefreshed = true;
			fsHelper.injectGuildList(memberList);
		}
	},

	injectChat: function() {

	},

	addLogColoring: function(logScreen, dateColumn) {
		if (!GM_getValue("enableLogColoring")) return;
		var lastCheckScreen = "last" + logScreen + "Check";
		var localLastCheckMilli=GM_getValue(lastCheckScreen);
		if (!localLastCheckMilli) localLastCheckMilli=(new Date()).getTime();

		var chatTable = fsHelper.findNode("//table[@border='0' and @cellpadding='2' and @width='100%']");

		var localDateMilli = (new Date()).getTime();
		var gmtOffsetMinutes = (new Date()).getTimezoneOffset();
		var gmtOffsetMilli = gmtOffsetMinutes*60*1000;

		for (var i=1;i<chatTable.rows.length;i++) {
			var aRow = chatTable.rows[i];
			//GM_log(aRow.innerHTML);
			if (aRow.cells[0].innerHTML) {
				//GM_log(aRow.cells[dateColumn].innerHTML);
				var cellContents = aRow.cells[dateColumn].innerHTML;
				cellContents = cellContents.substring(0,17); // fix for player log screen.
				postDateAsDate = fsHelper.textDateToDate(cellContents);
				postDateAsLocalMilli = postDateAsDate.getTime() - gmtOffsetMilli;
				postAge = (localDateMilli - postDateAsLocalMilli)/(1000*60);
				if (postDateAsLocalMilli > localLastCheckMilli) {
					aRow.style.backgroundColor = "yellow";
				}
				else if (postAge > 20 && postDateAsLocalMilli <= localLastCheckMilli) {
					aRow.style.backgroundColor = "#CD9E4B";

				}
			}
		}
		now=(new Date()).getTime()
		GM_setValue(lastCheckScreen, now.toString());
	},

	textDateToDate: function(textDate) {
		timeText = textDate.split(" ")[0];
		dateText = textDate.split(" ")[1];
		dayText = dateText.split("/")[0];
		monthText = dateText.split("/")[1];
		if (monthText == "Jan") {fullMonthText = "January"};
		if (monthText == "Feb") {fullMonthText = "February"};
		if (monthText == "Mar") {fullMonthText = "March"};
		if (monthText == "Apr") {fullMonthText = "April"};
		if (monthText == "May") {fullMonthText = "May"};
		if (monthText == "Jun") {fullMonthText = "June"};
		if (monthText == "Jul") {fullMonthText = "July"};
		if (monthText == "Aug") {fullMonthText = "August"};
		if (monthText == "Sep") {fullMonthText = "September"};
		if (monthText == "Oct") {fullMonthText = "October"};
		if (monthText == "Nov") {fullMonthText = "November"};
		if (monthText == "Dec") {fullMonthText = "December"};
		yearText = dateText.split("/")[2];
		dateAsDate = new Date(fullMonthText + " " + dayText + ", " + yearText + " " + timeText + ":00")
		return dateAsDate;
	},

	addLogWidgets: function() {
		var logTable = fsHelper.findNode("//table[@border='0' and @cellpadding='2' and @width='100%']");
		var memberList = fsHelper.getValueJSON("memberlist");
		var memberNameString;
		for (var i=0;i<memberList.members.length;i++) {
			var member=memberList.members[i];
			memberNameString += member.name + " ";
		}
		var isGuildie = false;
		for (var i=0;i<logTable.rows.length;i++) {
			var aRow = logTable.rows[i];
			if (i != 0) {
				if (aRow.cells[0].innerHTML) {
					firstCell = aRow.cells[0];
					//Valid Types: General, Chat, Guild
					messageType = firstCell.firstChild.getAttribute("title");
					if (messageType == "Chat") {
						var playerName = aRow.cells[2].firstChild.innerHTML;
						if (memberNameString.search(playerName) !=-1) {
							aRow.cells[2].firstChild.innerHTML = "<font style='color:green;'>" + playerName + "</font>";
							isGuildie = true;
						}
						var messageHTML = aRow.cells[2].innerHTML;
						var firstPart = messageHTML.split(">Reply</a>")[0];
						var secondPart = messageHTML.split(">Reply</a>")[1];
						//http://www.fallensword.com/index.php?cmd=trade&target_player=Bubbacus62
						var extraPart = " | <a href='index.php?cmd=trade&target_player=" + playerName + "'>Trade</a> ";
						aRow.cells[2].innerHTML = firstPart + ">Reply</a>" + extraPart + secondPart;
						isGuildie = false;
					}
				}
			}
			else {
				var messageNameCell = aRow.firstChild.nextSibling.nextSibling.nextSibling;
				messageNameCell.innerHTML += "&nbsp;&nbsp;<font style='color:green;'>(Guildies show up as green)</font>"
			}

		}
	},

	injectGuildList: function(memberList) {
		var oldMemberList = fsHelper.getValueJSON("oldmemberlist");
		if (!oldMemberList) oldMemberList=memberList;

		oldIds = new Array();
		for (var i=0; i<oldMemberList.members.length;i++) {
			if (oldMemberList.members[i].status=="Online") {
				oldIds.push(oldMemberList.members[i].id);
			}
		}

		var playerIdRE = /http:\/\/www.fallensword.com\/\?ref=(\d+)/
		var playerId=document.body.innerHTML.match(playerIdRE)[1];

		GM_setValue("memberlist", JSON.stringify(memberList));
		var injectHere = document.getElementById("fsHelperPlaceholderWorld");
		// injectHere.innerHTML=memberList.length;
		var displayList = document.createElement("TABLE");
		displayList.style.border = "1px solid #c5ad73";
		displayList.style.backgroundColor = "#4a3918";
		displayList.cellPadding = 1;
		displayList.width = 125;

		if (memberList.isRefreshed) {
			displayList.style.backgroundColor = "#6a5938";
		}

		var aRow=displayList.insertRow(displayList.rows.length);
		var aCell=aRow.insertCell(0);
		var output = "<ol style='color:white;font-size:10px;list-style-type:decimal;margin-left:1px;padding-left:20px;'>"
		for (var i=0;i<memberList.members.length;i++) {
			var member=memberList.members[i];
			if (member.status=="Online") {
				if (memberList.isRefreshed) {
					fsHelper.getFullPlayerData(member);
				}
				output += "<li>"
				output += "<a style='color:white;font-size:10px;' "
				output += "href=\"javascript:openWindow('index.php?cmd=quickbuff&tid=" + member.id + "', 'fsQuickBuff', 618, 500, 'scrollbars')\">[b]</a>&nbsp;";
				output += "<a style='color:white;font-size:10px;' "
				output += "href=\"http://www.fallensword.com/index.php?cmd=message&target_player=" + member.name + "\">[m]</a>&nbsp;";
				output += "<a onmouseover=\"tt_setWidth(105);";
				output += "Tip('<div style=\\'text-align:center;width:105px;\\'><b>" + member.rank + "</b><br/>XP: " + member.xp + "<br/>Lvl:" + member.level + "<br/>";
				if (member.hasFullData) {

				}
				output += "</div>');\" ";
				output += "style='color:"
				if (oldIds.indexOf(member.id)<0 /* || member.justLoggedIn */) { // just logged in
					output += "yellow";
					member.loggedIn=new Date().getTime();
					member.lastSeen=new Date().getTime();
					// if (memberList.isRefreshed) {member.justLoggedIn=true; }
				} else {
					output += (member.id==playerId)?"lime":"white";
				}
				output += ";font-size:10px;'"
				output += " href='http://www.fallensword.com/index.php?cmd=profile&player_id=" + member.id + "'>" + member.name + "</a>";
				// output += "<br/>"
				output += "</li>"
			}
			else {
				member.loggedIn=0;
			}
		}
		output += "</ol>"
		aCell.innerHTML = output;
		var breaker=document.createElement("BR");
		injectHere.parentNode.insertBefore(breaker, injectHere.nextSibling);
		injectHere.parentNode.insertBefore(displayList, injectHere.nextSibling);

		if (memberList.isRefreshed) {
			GM_setValue("oldmemberlist", JSON.stringify(memberList));
		}
	},

	getFullPlayerData: function(member) {
		return;
		GM_xmlhttpRequest({
			method: 'GET',
			url: "http://www.fallensword.com/index.php?cmd=profile&player_id=" + member.id,
			headers: {
				"User-Agent" : navigator.userAgent,
				"Content-Type": "application/x-www-form-urlencoded",
				"Cookie" : document.cookie
			},
			onload: function(responseDetails) {
				fsHelper.parsePlayerData(member.id, responseDetails.responseText);
			},
		})
	},

	parsePlayerData: function(memberId, responseText) {
		// return;
		var doc=fsHelper.createDocument(responseText)
		// var statistics = fsHelper.findNode("//table[contains(tr/td/b,'Level:')]",0,doc);
		var statistics = fsHelper.findNode("//table[contains(tbody/tr/td/b,'Level:')]",0,doc);
		var levelNode = fsHelper.findNode("//td[contains(b,'Level:')]",0,statistics);
		var levelValue = levelNode.nextSibling.innerHTML;
		GM_log(levelValue);
		// GM_log(statistics.innerHTML); //parentNode.parentNode.nextSibling.nextSibling.nextSibling.innerHTML);
	},

	injectBank: function() {
		var injectHere;
		var bank = fsHelper.findNode("//b[contains(.,'Bank')]");
		if (bank) {
			bank.innerHTML+="<br><a href='/index.php?cmd=guild&subcmd=bank'>Guild Bank</a>";
		}
	},


	injectAuctionHouse: function() {
		var allItems = document.getElementsByTagName("IMG");
		var savedItems = fsHelper.getValueJSON("savedItems")
		for (var i=0; i<allItems.length; i++) {
			anItem = allItems[i];
			if (anItem.src.search("items") != -1) {
				var mouseOver=anItem.getAttribute("onmouseover");
				var reParams=/(\d+),\s*(\d+),\s*(\d+),\s*(\d+)/
				var reResult=reParams.exec(mouseOver);
				var itemId=reResult[1];
				var invId=reResult[2];
				var type=reResult[3];
				var pid=reResult[4];
				if (savedItems && savedItems.indexOf(itemId)>=0) {
					//fsHelper.injectDropItemsParse(savedItems(itemId).reponseText);
					GM_log("script error");
					//window.alert(savedItems(itemId).reponseText);
				}
				else {
						fsHelper.insertAuctionGetItemDetails(itemId, invId, type, pid);
				}
			}
		}
	},

	insertAuctionGetItemDetails: function(itemId, invId, type, pid) {
		var theUrl = "fetchitem.php?item_id="+itemId+"&inv_id="+invId+"&t="+type+"&p="+pid /*+"&uid="+1220693678*/
		theUrl = document.location.protocol + "//" + document.location.host + "/" + theUrl
		GM_xmlhttpRequest({
			method: 'GET',
			url: theUrl,
			headers: {
				//    'User-agent': 'Mozilla/4.0 (compatible) Greasemonkey',
			//    'Accept': 'application/atom+xml,application/xml,text/xml',
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			onload: function(responseDetails) {
				var craft="";
				var responseText=responseDetails.responseText;
				if (responseText.search(/Uncrafted|Very Poor|Poor|Average|Good|Very Good|Excellent|Perfect/) != -1){
					var fontLineRE=/<\/b><\/font><br>([^<]+)<font color='(#[0-9A-F]{6})'>([^<]+)<\/font>/
					var fontLineRX=fontLineRE.exec(responseText)
					craft = fontLineRX[3];
				}
				var forgeCount=0, re=/hellforge\/forgelevel.gif/ig;

				while(re.exec(responseText)) {
					forgeCount++;
				}
				fsHelper.injectAuctionExtraText(invId,craft,forgeCount);
			}
		})
	},

	injectAuctionExtraText: function(invId, craft, forgeCount) {
		var imgserver = fsHelper.getImageServer();

		var allItems = document.getElementsByTagName("IMG");
		for (var i=0; i<allItems.length; i++) {
			anItem = allItems[i];
			if (anItem.src.search("items") != -1) {
				if (anItem.getAttribute("onmouseover").search(invId) != -1) {
					theText=anItem.parentNode.nextSibling.nextSibling;
					var preText = craft
					if (forgeCount != 0) {
						preText +=  " " + forgeCount + "<img src='" + imgserver + "/hellforge/forgelevel.gif'>"
					}
					theText.innerHTML = preText + "<br>" + theText.innerHTML;
				}
			}
		}
	},

	injectDropItemsAuction: function() {
		//function to add links to all the items in the drop items list
		var itemName, itemInvId, theTextNode, newLink;
		var allItems=fsHelper.findNodes("//input[@type='checkbox']");
		for (var i=0; i<allItems.length; i++) {
			anItem = allItems[i];
			itemInvId = anItem.value;
			theTextNode = fsHelper.findNode("../../td", 2, anItem);
			itemName = theTextNode.innerHTML.replace(/\&nbsp;/i,"");
			theTextNode.innerHTML = "<a href='http://www.fallensword.com/?cmd=auctionhouse&type=-1&search_text="
				+ escape(itemName)
				+ "'>[AH]</a> "
				+ "<a href='http://www.fallensword.com/index.php?cmd=auctionhouse&subcmd=create2&inv_id=" + itemInvId + "'>"
				+ "[Sell]</a> "
				+ theTextNode.innerHTML;

			//
			// newLink = document.createElement("a")
			// newLink.href="
			// newLink.textContent="[AH]" // Search for " + itemName + " in Auction House]"
			// window.alert(newLink);
			// theText.insertBefore(newLink, theText);
			// theText.textContent=" " + theText.textContent
			// theText.innerHTML += " <a href=http://www.fallensword.com/?cmd=auctionhouse&type=-1&search_text=" + escape(itemName) + "></a>"
		}
	},

	injectReportPaint: function() {
		//Get the list of online members
		var memberList = fsHelper.getValueJSON("memberlist");

		var injectHere, searchString;
		for (var i=0;i<memberList.members.length;i++) {
			var member=memberList.members[i];
			if (member.status=="Online") {
				var player=fsHelper.findNode("//b[contains(., '" + member.name + "')]");
				if (player) {
					player.innerHTML = "[Online] " + player.innerHTML;
				}
			}
		}
	},

	injectDropItems: function() {
		if (GM_getValue("disableItemColoring")) return;
		var savedItems = fsHelper.getValueJSON("savedItems")
		var allItems = fsHelper.findNodes("//input[@type='checkbox']");
		for (var i=0; i<allItems.length; i++) {
			anItem = allItems[i];
			theLocation=anItem.parentNode.nextSibling.nextSibling;
			theImage=anItem.parentNode.nextSibling.firstChild.firstChild;
			var mouseOver=theImage.getAttribute("onmouseover");
			var reParams=/(\d+),\s*(\d+),\s*(\d+),\s*(\d+)/
			var reResult=reParams.exec(mouseOver);
			var itemId=reResult[1];
			var invId=reResult[2];
			var type=reResult[3];
			var pid=reResult[4];
			if (savedItems && savedItems.indexOf(itemId)>=0) {
				//
				fsHelper.injectDropItemsParse(savedItems(itemId).reponseText);
			}
			else {
				var theUrl = "fetchitem.php?item_id="+itemId+"&inv_id="+invId+"&t="+type+"&p="+pid /*+"&uid="+1220693678*/
				theUrl = document.location.protocol + "//" + document.location.host + "/" + theUrl
				GM_xmlhttpRequest({
					method: 'GET',
					url: theUrl,
					callback: theImage,
					headers: {
					//    'User-agent': 'Mozilla/4.0 (compatible) Greasemonkey',
					//    'Accept': 'application/atom+xml,application/xml,text/xml',
						'Content-Type': 'application/x-www-form-urlencoded'
					},
					onload: function(responseDetails, callback) {
						fsHelper.injectDropItemsPaint(responseDetails, this.callback);
					}
				})
			}
		}
	},

	injectDropItemsPaint: function(responseDetails, callback) {
		var fontLineRE=/<center><font color='(#[0-9A-F]{6})' size=2>/; // <b>[^<]+<\/b>/
		var fontLineRX=fontLineRE.exec(responseDetails.responseText)
		var textNode = fsHelper.findNode("../../../td", 2, callback);
		textNode.style.color=fontLineRX[1];
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
				var relationship = fsHelper.guildRelationship(aLink.text)
				switch (relationship) {
					case "self":
						warning.innerHTML="<br/>Member of your own guild";
						color = "green";
						break;
					case "friendly":
						warning.innerHTML="<br/>Do not attack - Guild is friendly!";
						color = "yellow";
						break;
					case "old":
						warning.innerHTML="<br/>Do not attack - You've been in that guild once!";
						color = "gray";
						break;
					default:
						changeAppearance = false;
				}
				if (changeAppearance) {
					aLink.parentNode.style.color=color;
					aLink.style.color=color;
					aLink.parentNode.insertBefore(warning, aLink.nextSibling);
				}
			}
		}

		var player = fsHelper.findNode("//textarea[@id='holdtext']");
		var avyrow = fsHelper.findNode("//img[contains(@title, 's Avatar')]");
		var playerid = document.URL.match(/\w*\d{5}\d*/)
		var idindex, newhtml, imgserver;

		if (player)
		{
			if (!playerid)
			{
				playerid = player.innerHTML;
				idindex = playerid.indexOf("?ref=") + 5;
				playerid = playerid.substr(idindex);
			}

			var playeravy = avyrow.parentNode.firstChild ;
			while ((playeravy.nodeType == 3)&&(!/\S/.test(playeravy.nodeValue)))
			{
				playeravy = playeravy.nextSibling ;
			}
			var playername = playeravy.getAttribute("title");
			playername = playername.substr(0, playername.indexOf("'s Avatar"));

			imgserver = fsHelper.getImageServer();

			var auctiontext = "Go to " + playername + "'s auctions" ;
			var ranktext = "Rank " +playername + "" ;

			newhtml = avyrow.parentNode.innerHTML + "</td></tr><tr><td align='center' colspan='2'>" ;
			newhtml += "<a href='javaScript:quickBuff(" + playerid ;
			newhtml += ");'><img alt='Buff " + playername + "' title='Buff " + playername + "' src=" ;
			newhtml += imgserver + "/skin/realm/icon_action_quickbuff.gif></a>&nbsp;&nbsp;" ;
			newhtml += "<a href=http://www.fallensword.com/?cmd=auctionhouse&type=-3&tid=" ;
			newhtml += playerid + '><img alt="' + auctiontext + '" title="' + auctiontext + '" src=';
			newhtml += imgserver + "/skin/gold_button.gif></a>&nbsp;&nbsp;";
			if (relationship == "self" && GM_getValue("showAdmin")) {
				newhtml += "<a href='http://www.fallensword.com/index.php?cmd=guild&subcmd=members&subcmd2=changerank&member_id=" ;
				newhtml += playerid + '><img alt="' + ranktext + '" title="' + ranktext + '" src=';
				newhtml += imgserver + "/guilds/" + guildId + "_mini.jpg></a>" ;
			}
			avyrow.parentNode.innerHTML = newhtml ;
		}
	},

	injectGroupStats: function() {
		var attackTitleElement = fsHelper.findNode("//table[@width='400']/tbody/tr/td[contains(.,'Attack:')]");
		attackValueElement = attackTitleElement.nextSibling;
		attackValueElement.innerHTML = "<table><tbody><tr><td style='color:blue;'>" + attackValueElement.innerHTML +
			"</td><td>(</td><td title='attackValue'>" + attackValueElement.innerHTML +
			"</td><td>)</td></tr></tbody></table>";
		var defenseTitleElement = fsHelper.findNode("//table[@width='400']/tbody/tr/td[contains(.,'Defense:')]");
		defenseValueElement = defenseTitleElement.nextSibling;
		defenseValueElement.innerHTML = "<table><tbody><tr><td style='color:blue;'>" + defenseValueElement.innerHTML +
			"</td><td>(</td><td title='defenseValue'>" + defenseValueElement.innerHTML +
			"</td><td>)</td></tr></tbody></table>";
		var armorTitleElement = fsHelper.findNode("//table[@width='400']/tbody/tr/td[contains(.,'Armor:')]");
		armorValueElement = armorTitleElement.nextSibling;
		armorValueElement.innerHTML = "<table><tbody><tr><td style='color:blue;'>" + armorValueElement.innerHTML +
			"</td><td>(</td><td title='armorValue'>" + armorValueElement.innerHTML +
			"</td><td>)</td></tr></tbody></table>";
		var damageTitleElement = fsHelper.findNode("//table[@width='400']/tbody/tr/td[contains(.,'Damage:')]");
		damageValueElement = damageTitleElement.nextSibling;
		damageValueElement.innerHTML = "<table><tbody><tr><td style='color:blue;'>" + damageValueElement.innerHTML +
			"</td><td>(</td><td title='damageValue'>" + damageValueElement.innerHTML +
			"</td><td>)</td></tr></tbody></table>";
		var hpTitleElement = fsHelper.findNode("//table[@width='400']/tbody/tr/td[contains(.,'HP:')]");
		hpValueElement = hpTitleElement.nextSibling;
		hpValueElement.innerHTML = "<table><tbody><tr><td style='color:blue;'>" + hpValueElement.innerHTML +
			"</td><td>(</td><td title='hpValue'>" + hpValueElement.innerHTML +
			"</td><td>)</td></tr></tbody></table>";
		GM_xmlhttpRequest({
			method: 'GET',
			url: "http://www.fallensword.com/index.php?cmd=guild&subcmd=mercs",
			headers: {
				"User-Agent" : navigator.userAgent,
				"Content-Type": "application/x-www-form-urlencoded",
				"Cookie" : document.cookie
			},
			onload: function(responseDetails) {
				fsHelper.parseMercStats(responseDetails.responseText);
			},
		})
	},

	parseMercStats: function(responseText) {
		var mercPage=fsHelper.createDocument(responseText);
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
		var attackValue = fsHelper.findNode("//td[@title='attackValue']");
		attackNumber=attackValue.innerHTML.replace(/,/,"")*1;
		attackValue.innerHTML = fsHelper.addCommas(attackNumber - Math.round(totalMercAttack*0.2));
		var defenseValue = fsHelper.findNode("//td[@title='defenseValue']");
		defenseNumber=defenseValue.innerHTML.replace(/,/,"")*1;
		defenseValue.innerHTML = fsHelper.addCommas(defenseNumber - Math.round(totalMercDefense*0.2));
		var armorValue = fsHelper.findNode("//td[@title='armorValue']");
		armorNumber=armorValue.innerHTML.replace(/,/,"")*1;
		armorValue.innerHTML = fsHelper.addCommas(armorNumber - Math.round(totalMercArmor*0.2));
		var damageValue = fsHelper.findNode("//td[@title='damageValue']");
		damageNumber=damageValue.innerHTML.replace(/,/,"")*1;
		damageValue.innerHTML = fsHelper.addCommas(damageNumber - Math.round(totalMercDamage*0.2));
		var hpValue = fsHelper.findNode("//td[@title='hpValue']");
		hpNumber=hpValue.innerHTML.replace(/,/,"")*1;
		hpValue.innerHTML = fsHelper.addCommas(hpNumber - Math.round(totalMercHP*0.2));
	},

	addCommas: function(nStr) {
		nStr += '';
		x = nStr.split('.');
		x1 = x[0];
		x2 = x.length > 1 ? '.' + x[1] : '';
		var rgx = /(\d+)(\d{3})/;
		while (rgx.test(x1)) {
			x1 = x1.replace(rgx, '$1' + ',' + '$2');
		}
		return x1 + x2;
	},

	injectGroups: function() {
		var allItems = fsHelper.findNodes("//img[@title='View Group Stats']");
		for (var i=0; i<allItems.length; i++) {
			anItem = allItems[i];
			var href = anItem.parentNode.getAttribute("href");
			fsHelper.retrieveGroupData(href, anItem.parentNode);
		}
		allItems = fsHelper.findNodes("//tr[td/a/img/@title='View Group Stats']");
		var memberList=fsHelper.getValueJSON("memberlist");
		// window.alert(typeof(memberList.members));
		// memberList.lookupByName.find
		for (i=0; i<allItems.length; i++) {
			var theItem=allItems[i].cells[0];
			var foundName=theItem.textContent;
			for (j=0; j<memberList.members.length; j++) {
				var aMember=memberList.members[j];
				// window.alert(aMember.name);
				// I hate doing two loops, but using a hashtable implementation I found crashed my browser...
				if (aMember.name==foundName) {
					theItem.innerHTML += " [" + aMember.level + "]";
				}
			}
			// window.alert(allItems[i].cells[0].textContent);
		}
	},

	retrieveGroupData: function(href, link) {
		GM_xmlhttpRequest({
			method: 'GET',
			url: "http://www.fallensword.com/" + href,
			callback: link,
			headers: {
				"User-Agent" : navigator.userAgent,
				"Content-Type": "application/x-www-form-urlencoded",
				"Cookie" : document.cookie
			},
			onload: function(responseDetails) {
				fsHelper.parseGroupData(responseDetails.responseText, this.callback);
			},
		})
	},

	parseGroupData: function(responseText, linkElement) {
		var doc=fsHelper.createDocument(responseText);
		// GM_log(responseText);
		// var statisticsElement=fsHelper.findNode("//td[contains(.,'Statistics')]", 0, doc);
		var attackLocation = fsHelper.findNode("//td[contains(font,'Attack:')]",0,doc).nextSibling;
		var attackValue = attackLocation.textContent;
		var defenseLocation = fsHelper.findNode("//td[contains(font,'Defense:')]",0,doc).nextSibling;
		var defenseValue = defenseLocation.textContent;
		var armorLocation = fsHelper.findNode("//td[contains(font,'Armor:')]",0,doc).nextSibling;
		var armorValue = armorLocation.textContent;
		var damageLocation = fsHelper.findNode("//td[contains(font,'Damage:')]",0,doc).nextSibling;
		var damageValue = damageLocation.textContent;
		var hpLocation = fsHelper.findNode("//td[contains(font,'HP:')]",0,doc).nextSibling;
		var hpValue = hpLocation.textContent;

		// var linkElement=fsHelper.findNode("//a[@href='" + href + "']");
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

	hideGuildAvatar: function() {
		var guildLogoElement = fsHelper.findNode("//img[contains(@title, 's Logo')]");
		guildLogoElement.style.display = "none";
	},

	hideGuildStatistics: function() {
		var linkElement=fsHelper.findNode("//a[@href='index.php?cmd=guild&subcmd=changefounder']");
		statisticsListElement = linkElement.parentNode.parentNode.parentNode.nextSibling.nextSibling.nextSibling.nextSibling;
		statisticsListElement.style.display = "none";
	},

	hideGuildStructures: function() {
		var linkElement=fsHelper.findNode("//a[@href='index.php?cmd=guild&subcmd=structures']");
		structureListElement = linkElement.parentNode.parentNode.parentNode.nextSibling.nextSibling.nextSibling.nextSibling;
		structureListElement.style.display = "none";
	},

	injectSettings: function() {
		var configData=
			'<form><table width="100%" cellspacing="0" cellpadding="5" border="0">' +
			'<tr><td colspan="4" height="1" bgcolor="#333333"></td></tr>' +
			'<tr><td colspan="4"><b>Fallen Sword Helper configuration</b></td></tr>' +
			'<tr><td colspan="4" align=center><input type="button" class="custombutton" value="Check for updates" id="fsHelperCheckUpdate"></td></tr>' +
			'<tr><td colspan="4" align="left"><b>Enter guild names, seperated by commas</td></tr>' +
			'<tr><td>Own Guild</td><td colspan="3"><input name="guildSelf" size="60" value="' + GM_getValue("guildSelf") + '"></td></tr>' +
			'<tr><td>Friendly Guilds</td><td colspan="3"><input name="guildFrnd" size="60" value="' + GM_getValue("guildFrnd") + '"></td></tr>' +
			'<tr><td>Old Guilds</td><td colspan="3"><input name="guildPast" size="60" value="' + GM_getValue("guildPast") + '"></td></tr>' +
			'<tr><td colspan="4" align="left">Other preferences</td></tr>' +
			'<tr><td align="right">Automatically Kill All Monsters [ ' +
				'<a href="#" onmouseover="Tip(\'<b>Kill All Monsters</b><br><br>CAUTION: If this is set, while you are moving around the world it will automatically kill all the non-elite monsters on the square you move in to.\');">?</a>' +
				' ]:</td><td><input name="killAll" type="checkbox" value="on"' + (GM_getValue("killAll")?" checked":"") + '></td>' +
			'<td align="right">Hide Top Banner [ ' +
				'<a href="#" onmouseover="Tip(\'<b>Hide Top Banner</b><br><br>Pretty simple ... it just hides the top banner.\');">?</a>' +
				' ]:</td><td><input name="hideBanner" type="checkbox" value="on"' + (GM_getValue("hideBanner")?" checked":"") + '></td></tr>' +
			'<tr><td align="right">Show Administrative Options [ ' +
				'<a href="#" onmouseover="Tip(\'<b>Show Admininstrative Options</b><br><br>I have not really figured out what this does yet ... I think it works for guild founders only.\');">?</a>' +
				' ]:</td><td><input name="showAdmin" type="checkbox" value="on"' + (GM_getValue("showAdmin")?" checked":"") + '></td>' +
			'<td align="right">Hide Guild Info [ ' +
				'<a href="#" onmouseover="Tip(\'<b>Hide Guild Info</b><br><br>This will hide three fields on the Guild-Manage screen, the logo, the statistics and the structures. You can always get them back by unchecking this.\');">?</a>' +
				' ]:</td><td><input name="hideGuildInfo" type="checkbox" value="on"' + (GM_getValue("hideGuildInfo")?" checked":"") + '></td></tr>' +
			'<tr><td align="right">Disable Item Coloring [ ' +
				'<a href="#" onmouseover="Tip(\'<b>Disable Item Coloring</b><br><br>There is some code that colors the item text based on the rarity of the item. I did not like it so I put in an option to turn it off.\');">?</a>' +
				' ]:</td><td><input name="disableItemColoring" type="checkbox" value="on"' + (GM_getValue("disableItemColoring")?" checked":"") + '></td>' +
			'<td align="right">Enable Log Coloring [ ' +
				'<a href="#" onmouseover="Tip(\'<b>Enable Log Coloring</b><br><br>Three logs will be colored if this is enabled, Guild Chat, Guild Log and Player Log. It will show any new messages in yellow and anything 20 minutes old ones in brown.\');">?</a>' +
				' ]:</td><td><input name="enableLogColoring" type="checkbox" value="on"' + (GM_getValue("enableLogColoring")?" checked":"") + '></td></td></tr>' +
			'<tr><td align="right">Show Completed Quests [ ' +
				'<a href="#" onmouseover="Tip(\'<b>Show Completed Quests</b><br><br>Pretty simple ... this will show completed quests that have been hidden.\');">?</a>' +
				' ]:</td><td><input name="showCompletedQuests" type="checkbox" value="on"' + (GM_getValue("showCompletedQuests")?" checked":"") + '></td>' +
			'<td colspan="2"></td></tr>' +
			'<tr><td colspan="4" align=center><input type="button" class="custombutton" value="Save" id="fsHelperSaveOptions"></td></tr>' +
			'</table></form>';
		var insertHere = fsHelper.findNode("//table[@width='100%']");
		var newRow=insertHere.insertRow(insertHere.rows.length);
		var newCell=newRow.insertCell(0);
		newCell.colSpan=3;
		newCell.innerHTML=configData;

		// insertHere.insertBefore(configData, insertHere);

		document.getElementById('fsHelperSaveOptions').addEventListener('click', fsHelper.saveConfig, true);
		document.getElementById('fsHelperCheckUpdate').addEventListener('click', fsHelper.checkForUpdate, true);
	},

	saveConfig: function(evt) {
		var oForm=evt.target.form;
		fsHelper.saveValueForm(oForm, "guildSelf");
		fsHelper.saveValueForm(oForm, "guildFrnd");
		fsHelper.saveValueForm(oForm, "guildPast");
		fsHelper.saveValueForm(oForm, "showAdmin");
		fsHelper.saveValueForm(oForm, "killAll");
		fsHelper.saveValueForm(oForm, "disableItemColoring");
		fsHelper.saveValueForm(oForm, "enableLogColoring");
		fsHelper.saveValueForm(oForm, "showCompletedQuests");
		fsHelper.saveValueForm(oForm, "hideBanner");
		fsHelper.saveValueForm(oForm, "hideGuildInfo");
		window.alert("FS Helper Settings Saved");
		return false;
	},

	guildRelationship: function(txt) {
		var guildSelf = GM_getValue("guildSelf");
		var guildFrnd = GM_getValue("guildFrnd");
		var guildPast = GM_getValue("guildPast");
		if (!guildSelf) {
			guildSelf="";
			GM_setValue("guildSelf", guildSelf);
		}
		if (!guildFrnd) {
			guildFrnd="";
			GM_setValue("guildFrnd", guildFrnd);
		}
		if (!guildPast) {
			guildPast="";
			GM_setValue("guildPast", guildPast);
		}
		guildSelf=guildSelf.toLowerCase().replace(/\s*,\s*/,",").split(","); // "TheRetreat"
		guildFrnd=guildFrnd.toLowerCase().replace(/\s*,\s*/,",").split(","); // "Armata Rossa,Asphaltanza,Dark Siege,Elendil,Shadow Dracones,The Shadow Warriors,Tuga Knights"
		guildPast=guildPast.toLowerCase().replace(/\s*,\s*/,",").split(","); // "Dark Phoenix"
		if (guildSelf.indexOf(txt.toLowerCase())!=-1) return "self";
		if (guildFrnd.indexOf(txt.toLowerCase())!=-1) return "friendly";
		if (guildPast.indexOf(txt.toLowerCase())!=-1) return "old";
		return "";
	}
};


/*
    http://www.JSON.org/json2.js
    2008-09-01

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html

    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the object holding the key.

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be used to
            select the members to be serialized. It filters the results such
            that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.

    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.
*/

/*jslint evil: true */

/*global JSON */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", call,
    charCodeAt, getUTCDate, getUTCFullYear, getUTCHours, getUTCMinutes,
    getUTCMonth, getUTCSeconds, hasOwnProperty, join, lastIndex, length,
    parse, propertyIsEnumerable, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/

// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

if (!this.JSON) {
    JSON = {};
}
(function () {

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function (key) {

            return this.getUTCFullYear()   + '-' +
                 f(this.getUTCMonth() + 1) + '-' +
                 f(this.getUTCDate())      + 'T' +
                 f(this.getUTCHours())     + ':' +
                 f(this.getUTCMinutes())   + ':' +
                 f(this.getUTCSeconds())   + 'Z';
        };

        String.prototype.toJSON =
        Number.prototype.toJSON =
        Boolean.prototype.toJSON = function (key) {
            return this.valueOf();
        };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapeable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapeable.lastIndex = 0;
        return escapeable.test(string) ?
            '"' + string.replace(escapeable, function (a) {
                var c = meta[a];
                if (typeof c === 'string') {
                    return c;
                }
                return '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
            }) + '"' :
            '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// If the object has a dontEnum length property, we'll treat it as an array.

            if (typeof value.length === 'number' &&
                    !value.propertyIsEnumerable('length')) {

// The object is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0 ? '[]' :
                    gap ? '[\n' + gap +
                            partial.join(',\n' + gap) + '\n' +
                                mind + ']' :
                          '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    k = rep[i];
                    if (typeof k === 'string') {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0 ? '{}' :
                gap ? '{\n' + gap + partial.join(',\n' + gap) + '\n' +
                        mind + '}' : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                     typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/.
test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@').
replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function' ?
                    walk({'': j}, '') : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
})();

fsHelper.onPageLoad(null);
