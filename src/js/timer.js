"use strict";

var timer = (function(regListener, regProp, getProp, pretty, ui, pushSignal) {
	var container;

	/**
	 * n: n phase(s) before stop
	 * -1: idle
	 * -2: ready to start (space pressed)
	 * -3: inspecting
	 * -4: ready to inspection (space pressed)
	 */
	var status = -1;

	var curTime = []; //[inspection time, phaseN, phaseN-1, ...]
	var startTime;

	function reset() {
		var type = getProp('input');
		status = -1;

		virtual333.setEnable(type == 'v');
		virtual333.reset();
		lcd.setEnable(type != 'i');
		lcd.reset(type == 'v' || type == 'g' && getProp('giiVRC'));
		keyboardTimer.reset();
		inputTimer.setEnable(type == 'i');
		type == 'i' ? $('#touch').hide() : $('#touch').show();
		ui.setAutoShow(true);
	}

	var voicem8s = {
		play: $.noop
	};
	var voicem12s = voicem8s;
	var voicef8s = voicem8s;
	var voicef12s = voicem8s;

	if (window['Audio'] !== undefined) {
		voicem8s = new Audio("data:audio/mp3;base64,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");
		voicem12s = new Audio("data:audio/mp3;base64,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");
		voicef8s = new Audio("data:audio/mp3;base64,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");
		voicef12s = new Audio("data:audio/mp3;base64,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");
	}

	var nPhases = {
		'n': 1,
		'cfop': 4,
		'fp': 2,
		'roux': 4,
		'cf4op': 7
	}

	function checkUseIns() {
		var ret = getProp('useIns');
		if (ret === true || ret == 'a') {
			return true;
		} else if (ret === false || ret == 'n') {
			return false;
		} else if (ret == 'b') {
			return /^(333ni|444bld|555bld|r3ni)$/.exec(getProp('scrType')) == null;
		}
	}

	var lcd = (function() {

		var div;
		var rightDiv = $('<div />');
		var runningDiv;
		var runningId;

		var staticAppend = "";
		var divDict = ["", ""];

		var lasttime = 0;

		function setRunning(run, right) {
			if (run && runningId == undefined) {
				requestAnimFrame(runningThread);
				runningId = 1;
				lasttime = 0;
			} else if (!run && runningId != undefined) {
				runningId = undefined;
			}
			runningDiv = right ? rightDiv : div;
		}

		function runningThread(timestamp) {
			if (status == 0 || status == -1 || status == -4 || runningId == undefined) {
				return;
			}
			var time = $.now() - startTime;
			var curAppend = runningDiv === rightDiv ? staticAppend : "";
			if (status == -3 || (status == -2 && checkUseIns())) {
				setHtml(runningDiv, (getProp('timeU') != 'n' ? ((time > 17000) ? 'DNF' : (time > 15000) ? '+2' : 15 - ~~(time / 1000)) : TIMER_INSPECT) + curAppend);
			} else { //>0
				var pret = pretty(time, true);
				setHtml(runningDiv, {
					'u': pret,
					'c': pret.replace(/([.>])(\d)\d+(<|$)/, "$1$2$3"),
					's': pret.split(".")[0],
					'n': TIMER_SOLVE,
					'i': TIMER_SOLVE
				}[getProp('timeU')] + curAppend);
			}

			if (status == -3 || status == -2) { //inspection alert
				if (runningDiv !== rightDiv) {
					if (time >= 12000) {
						setHtml(rightDiv, '<div style="font-family: Arial;">Go!!!&nbsp;&nbsp;</div>');
					} else if (time >= 8000) {
						setHtml(rightDiv, '<div style="font-family: Arial;">8s!&nbsp;&nbsp;</div>');
					}
				}
				if (getProp('voiceIns') != 'n') {
					if (time >= 7900 && lasttime < 7900) {
						(getProp('voiceIns') == '1' ? voicem8s : voicef8s).play();
					}
					if (time >= 11900 && lasttime < 11900) {
						(getProp('voiceIns') == '1' ? voicem12s : voicef12s).play();
					}
				}

			}

			lasttime = time;
			requestAnimFrame(runningThread);
		}

		function fixDisplay(isKeyDown, isSpace) {
			var run = false;
			if (status == 0) {
				lcd.color('red');
			} else if (status == -1 || status == -4) {
				setColor(isKeyDown && isSpace ? (checkUseIns() ? '#0d0' : '#f00') : '');
			} else if (status == -2) {
				setColor(isKeyDown && isSpace ? '#0d0' : '');
				run = checkUseIns();
			} else if (status == -3) {
				setColor(isKeyDown && isSpace ? '#dd0' : '#f00');
				run = true;
			} else {
				setColor(isKeyDown ? '#0d0' : '');
				run = true;
			}
			ui.setAutoShow(status == 0 || status == -1);
			setRunning(run);
		}

		function setColor(val) {
			div.css('color', val);
			rightDiv.css('color', val);
		}

		function setValue(val, right) {
			setHtml(right ? rightDiv : div, val != undefined ? pretty(val, true) : '--:--');
		}

		function setHtml(div, val) {
			var idx = div === rightDiv ? 1 : 0;
			if (divDict[idx] === val) {
				return;
			}
			divDict[idx] = val;
			div.html(val);
		}

		function append(val) {
			setHtml(rightDiv, rightDiv.html() + val);
		}

		function setStaticAppend(val, append) {
			if (append) {
				staticAppend += val;
			} else {
				staticAppend = val;
			}
		}

		function setEnable(enable) {
			if (enable) {
				div.show();
			} else {
				div.hide();
			}
		}

		function reset(right) {
			div.empty();
			rightDiv.empty();
			divDict[0] = "";
			divDict[1] = "";
			setValue(0, right);
			setRunning(false);
			staticAppend = "";
		}


		function getMulPhaseAppend(curProgress, totPhases) {
			var ret = [];
			for (var i = totPhases; i > curProgress; i--) {
				ret.push(pretty(curTime[i] - ~~curTime[i + 1], true));
			}
			return curProgress == totPhases || totPhases == 1 ? '' :
				'<div style="font-size: 0.65em">' + '=' + ret.join('<br>+') + '</div>';
		}

		$(function() {
			div = $('#lcd');
			$('#multiphase').append(rightDiv);
		});

		return {
			setRunning: setRunning,
			color: setColor,
			val: setValue,
			setEnable: setEnable,
			append: append,
			setStaticAppend: setStaticAppend,
			fixDisplay: fixDisplay,
			getMulPhaseAppend: getMulPhaseAppend,
			reset: reset
		}
	})();

	var avgDiv = (function() {
		var avgDiv;
		var avgDiv1 = $('<span class="click">');
		var avgDiv2 = $('<span class="click">');

		var isShowAvgDiv = true;

		function showAvgDiv(enable) {
			if (enable && getProp('showAvg') && $.inArray(getProp('input'), ['s', 'm', 't', 'i']) != -1) {
				if (!isShowAvgDiv) {
					avgDiv.show();
					isShowAvgDiv = true;
				}
			} else {
				if (isShowAvgDiv) {
					avgDiv.hide();
					isShowAvgDiv = false;
				}
			}
		}

		function procSignal(signal, value) {
			avgDiv1.html(value[0]).unbind('click');
			if (value[2] != undefined) {
				avgDiv1.addClass('click').click(function() {
					value[4](value[2][0], value[2][1], value[2][2], value[2][3]);
				});
			} else {
				avgDiv1.removeClass('click');
			}
			avgDiv2.html(value[1]).unbind('click');
			if (value[3] != undefined) {
				avgDiv2.addClass('click').click(function() {
					value[4](value[3][0], value[3][1], value[3][2], value[3][3]);
				});
			} else {
				avgDiv2.removeClass('click');
			}
		}

		$(function() {
			avgDiv = $('#avgstr').append(avgDiv1, '<br>', avgDiv2);
			regListener('timer', 'avg', procSignal);
		})

		return {
			showAvgDiv: showAvgDiv
		}
	})();

	var keyboardTimer = (function() {

		var lastDown = 0;
		var lastStop = 0;
		var pressreadyId = undefined;

		function clearPressReady() {
			if (pressreadyId != undefined) {
				clearTimeout(pressreadyId);
				pressreadyId = undefined;
			}
		}

		function onkeyup(keyCode) {
			var now = $.now();
			if (keyCode == 32) {
				if (status == 0) {
					status = -1;
				} else if (status == -1 || status == -3) {
					clearPressReady();
					if (now - lastStop < 500) {
						lcd.fixDisplay(false, keyCode == 32);
						return;
					}
				} else if (status == -2) {
					var time = now;
					status = getProp('phases');
					var insTime = checkUseIns() ? (time - startTime) : 0;
					curTime = [insTime > 17000 ? -1 : (insTime > 15000 ? 2000 : 0)];
					startTime = time;
					lcd.reset();
				} else if (status == -4) {
					status = -3;
					lcd.reset();
					startTime = now;
				}
			}
			lcd.fixDisplay(false, keyCode == 32);
			if (keyCode == 32) {
				kernel.clrKey();
			}
		}

		function onkeydown(keyCode) {
			var now = $.now();
			if (now - lastDown < 200) {
				return;
			}
			if (status > 0) {
				lastDown = now;
				curTime[status] = lastDown - startTime;
				getProp('phases') != status && lcd.append('+');
				getProp('phases') != 1 && lcd.append(pretty(curTime[status] - ~~curTime[status + 1], true) + '&nbsp;<br>');
				if (keyCode == 27) {
					var times = [-1],
						i = 1;
					while (status < curTime.length) {
						times[i++] = curTime[status++];
					}
					status = 1;
					curTime = times;
				}
				if (--status == 0) {
					lastStop = lastDown;
					lcd.val(curTime[1]);
					ui.setAutoShow(true);
					pushSignal('time', curTime);
					if (keyCode != 32) {
						status = -1;
					}
				}
			} else if (keyCode == 32) {
				if ((status == (checkUseIns() ? -3 : -1)) && pressreadyId == undefined) {
					pressreadyId = setTimeout(pressReady, getProp('preTime'));
				} else if (status == -1 && checkUseIns()) {
					status = -4;
				}
			} else if (keyCode == 27 && status <= -1) { //inspection or ready to start, press ESC to reset
				clearPressReady();
				status = -1;
				lcd.val(0);
				ui.setAutoShow(true);
			}
			lcd.fixDisplay(true, keyCode == 32);
			if (keyCode == 32) {
				kernel.clrKey();
			}
		}

		function pressReady() {
			if (status == -1 || status == -3) {
				if (status == -1) {
					lcd.reset();
				}
				status = -2;
				pressreadyId = undefined;
				lcd.fixDisplay(true, true);
			}
		}

		function reset() {
			if (pressreadyId != undefined) {
				clearTimeout(pressreadyId);
				pressreadyId = undefined;
			}
			lastDown = lastStop = 0;
		}

		return {
			onkeydown: onkeydown,
			onkeyup: onkeyup,
			reset: reset
		}
	})();

	var inputTimer = (function() {
		var input = $('<textarea id="inputTimer" rows="1" />');
		var lastEmptyTrigger = 0;

		function parseInput() {
			//                          |1st     |2nd    |3rd    |4th        |5th        |6th                    |7th              |8th              |9th
			var reg = /^(?:[\d]+\. )?\(?(DNF)?\(?(\d*?):?(\d*?):?(\d*\.?\d*?)(\+)?\)?(?:=([\d:.+]+?))?\)?\s*(?:\[([^\]]+)\])?(?:   ([^@].*?))?(?:   @(.*?))?$/;
			var timeRe = /^(\d*?):?(\d*?):?(\d*\.?\d*?)$/;
			var arr = input.val();
			var now = $.now();
			if (/^[\s\n]*$/.exec(arr) && now > lastEmptyTrigger + 500) {
				kernel.pushSignal('ctrl', ['scramble', 'next']);
				lastEmptyTrigger = now;
				input.val('');
				return;
			}
			arr = arr.split(/\s*[,\n]\s*/);
			var time, ins, comment, scramble;
			for (var i = 0; i < arr.length; i++) {
				var m = reg.exec(arr[i]);
				if (m != null && m[4] != "") {
					time = Math.round(3600000 * ~~(m[2]) + 60000 * ~~(m[3]) + 1000 * parseFloat(m[4]));
					if (time == 0) {
						continue;
					}
					if (m[1] == "DNF") {
						ins = -1;
					} else if (m[5] == "+" && time > 2000) {
						ins = 2000;
						time -= 2000;
					} else {
						ins = 0;
					}
					var timeSplit = [];
					if (m[6]) { //multi-phase timing
						timeSplit = m[6].split('+').reverse();
						var timeRemain = time;
						for (var j = 0; j < timeSplit.length; j++) {
							var mt = timeRe.exec(timeSplit[j]);
							if (mt == null) {
								timeRemain = 1e8;
								break;
							}
							timeRemain -= Math.round(3600000 * ~~(mt[1]) + 60000 * ~~(mt[2]) + 1000 * parseFloat(mt[3]));
							timeSplit[j] = Math.max(0, timeRemain);
						}
						if (Math.abs(timeRemain) > 10 * timeSplit.length) {
							timeSplit = [];
						} else {
							timeSplit.pop();
						}
					}
					comment = m[7] || "";
					scramble = m[8];
					//TODO timestamp = m[9]
					curTime = [comment, scramble, [ins, time].concat(timeSplit)];
					var timestamp = mathlib.str2time(m[9]);
					if (timestamp) {
						curTime.push(timestamp);
					}
					pushSignal('time', curTime);
					kernel.clrKey();
				}
			}
			input.val('');
		}

		function setEnable(enable) {
			enable ? input.show() : input.hide();
			if (enable) {
				fobj = input;
				input[0].select();
				input.unbind("click").click(function() {
					input[0].select();
				});
			} else {
				fobj = undefined;
			}
		}

		$(function() {
			$('#lcd').after(input);
		});

		return {
			setEnable: setEnable,
			parseInput: parseInput,
			clear: function() {
				input.val('');
			}
		}
	})();

	var stackmatTimer = (function() {
		var enable = false;
		var lastRun = false;
		var inspectionTime;

		function stackmatCallback(state) {
			if (!enable) {
				return;
			}
			var now = $.now();
			if (!state.on) {
				status = -1;
				lcd.val();
				lcd.setRunning(false);
				lcd.color('');
				ui.setAutoShow(true);
				return;
			}
			var curTime = state.time_milli;
			if (state.running) {
				if (status == -3 || status == -4) {
					inspectionTime = now - startTime - curTime;
					lcd.reset();
				}
				status = 1;
				startTime = now - curTime;
				ui.setAutoShow(false);
			} else if (status == -1 && checkUseIns() && curTime == 0 && (state.rightHand || state.leftHand)) {
				status = -3;
				ui.setAutoShow(false);
				startTime = now;
			} else if (status != -3 && status != -4) {
				status = -1;
				lcd.val(curTime);
				ui.setAutoShow(true);
			}
			if (lastRun && !state.running && state.time_milli != 0) {
				inspectionTime = checkUseIns() ? inspectionTime > 17000 ? -1 : (inspectionTime > 15000 ? 2000 : 0) : 0;
				pushSignal('time', [inspectionTime, ~~curTime]);
			}
			lastRun = state.running;
			timerDisplay(state);
		}

		function timerDisplay(state) {
			if (state.greenLight) {
				lcd.color('#0d0');
			} else if (state.rightHand && state.leftHand) {
				lcd.color('#f00');
			} else {
				lcd.color('');
			}
			lcd.setRunning(status == -3 || (state.running && state.signalHeader != 67));
		}

		function onkeyup(keyCode) {
			var now = $.now();
			if (keyCode == 32 && status == -4) {
				status = -3;
				lcd.reset();
				startTime = now;
			}
			lcd.fixDisplay(false, keyCode == 32);
			if (keyCode == 32) {
				kernel.clrKey();
			}
		}

		function onkeydown(keyCode) {
			var now = $.now();

			if (keyCode == 32 && status == -1 && checkUseIns()) {
				status = -4;
				startTime = now;
			} else if (keyCode == 27 && status <= -1) { //inspection or ready to start, press ESC to reset
				status = -1;
				lcd.val(0);
				ui.setAutoShow(true);
			}
			lcd.fixDisplay(true, keyCode == 32);
			if (keyCode == 32) {
				kernel.clrKey();
			}
		}

		return {
			setEnable: function(input) { //s: stackmat, m: moyu
				enable = input == 's' || input == 'm';
				if (enable) {
					stackmat.setCallBack(stackmatCallback);
					stackmat.init(input);
				} else {
					stackmat.stop();
				}
			},
			onkeyup: onkeyup,
			onkeydown: onkeydown
		}
	})();

	var virtual333 = (function() {
		var twistyScene;
		var twisty;
		var insTime = 0;
		var moveCnt = 0;
		var lastMove = "";
		var totPhases = 1;

		function moveListener(move, started) {
			var now = $.now();
			if (status == -3 || status == -2) {
				if (twisty.isInspectionLegalMove(twisty, move)) {
					return;
				} else {
					if (checkUseIns()) {
						insTime = now - startTime;
					} else {
						insTime = 0;
					}
					startTime = now;
					moveCnt = 0;
					status = currentScrambleSize == 3 && currentScrambleType != "r3" ? nPhases[getProp('vrcMP', 'n')] : 1;
					totPhases = status;
					curTime = [insTime > 17000 ? -1 : (insTime > 15000 ? 2000 : 0)];
					lcd.setRunning(true, true);
					ui.setAutoShow(false);
				}
			} else if (status >= 1) {
				var curProgress = twisty.isSolved(twisty, getProp('vrcMP', 'n'));
				if (curProgress < status) {
					for (var i = status; i > curProgress; i--) {
						curTime[i] = now - startTime;
					}
				}
				status = Math.min(curProgress, status) || 1;
				lcd.setStaticAppend(lcd.getMulPhaseAppend(status, totPhases));
				if (curProgress == 0 && !started) {
					moveCnt += twisty.moveCnt();
					if (currentScrambleType.match(/^r\d+$/) && currentScramble.length != 0) {
						if (currentScrambleType != "r3") {
							currentScrambleSize++;
						}
						reset(true);
						scrambleIt();
						return;
					}
					ui.setAutoShow(true);
					status = -1;
					lcd.setRunning(false);
					lcd.setStaticAppend('');
					lcd.val(curTime[1], true);
					lcd.append(lcd.getMulPhaseAppend(0, totPhases));
					lcd.append(
						'<div style="font-family: Arial; font-size: 0.5em">' + moveCnt + " moves<br>" + ~~(100000 * moveCnt / curTime[1]) / 100.0 + " fps" + "</div>");
					// lcd.append("<br>" + moveCnt + "moves");
					pushSignal('time', curTime);
				}
			}
		}

		function reset(temp) {
			if (twistyScene == undefined || isReseted || !isEnable) {
				return;
			}
			isReseted = true;
			var size = currentScrambleSize;
			if (!size) {
				size = 3;
			}
			if (currentScrambleSize == 12) {
				twistyScene.initializeTwisty({
					type: "skewb",
					faceColors: [0xffffff, 0xff9000, 0x00ff00, 0xff0000, 0x0000ff, 0xffff00],
					scale: 0.9
				});
			} else if (currentScrambleSize == 1) {
				twistyScene.initializeTwisty({
					type: "sq1",
					faceColors: [0xffff00, 0x0000ff, 0xff0000, 0x00ff00, 0xff8800, 0xffffff],
					scale: 0.9
				});
			} else {
				twistyScene.initializeTwisty({
					type: "cube",
					faceColors: [0xffffff, 0xff0000, 0x00ff00, 0xffff00, 0xff9000, 0x0000ff], // U L F D L B
					dimension: size,
					stickerWidth: 1.7,
					scale: 0.9
				});
			}

			twisty = twistyScene.getTwisty();
			if (!temp) {
				lcd.setRunning(false, true);
				lcd.setStaticAppend('');
				setSize(getProp('timerSize'));
			}
		}

		function scrambleIt() {
			reset();
			var scramble = currentScramble;
			if (currentScrambleType.match(/^r\d+$/)) {
				scramble = currentScramble.shift().match(/\d+\) (.*)$/)[1];
				lcd.setStaticAppend("<br>" + (currentScramble.length + 1) + "/" + currentScramble.len);
			}
			scramble = twisty.parseScramble(scramble);
			isReseted = false;

			twistyScene.applyMoves(scramble);
			twisty.moveCnt(true);
		}

		function onkeydown(keyCode) {
			if (twistyScene == undefined) {
				return;
			}
			var now = $.now();
			if (status == -1) { // idle
				if (keyCode == 32) {
					scrambleIt();
					if (checkUseIns()) {
						status = -3; //inspection
						startTime = now;
						lcd.setRunning(true, true);
					} else {
						lcd.setRunning(false, true);
						lcd.val(0, true);
						status = -2; //ready
					}
					ui.setAutoShow(false);
				}
			} else if (status == -3 || status == -2 || status >= 1) { // Scrambled or Running
				if (keyCode == 27) { //ESC
					ui.setAutoShow(true);
					if (status == 1) {
						pushSignal('time', [-1, now - startTime]);
					}
					reset();
					status = -1;
				} else {
					var a = {
						keyCode: keyCode
					};
					twistyScene.keydown(a);
				}
			}
			if (keyCode == 27 || keyCode == 32) {
				kernel.clrKey();
			}
		}

		var isLoading = false;

		function load() {
			if (twistyScene != undefined) {} else if (window.twistyjs != undefined) {
				twistyScene = new twistyjs.TwistyScene();
				twistyScene.addMoveListener(moveListener);
				div.empty().append(twistyScene.getDomElement());
				reset();
				twistyScene.resize();
				isLoading = false;
			} else if (!isLoading && document.createElement('canvas').getContext) {
				$.getScript("js/twisty.js", load);
				isLoading = true;
			} else {
				div.css('height', '');
				div.html('--:--');
			}
		}

		var currentScramble;
		var currentScrambleType;
		var currentScrambleSize;
		var types = ['', 'sq1', '222', '333', '444', '555', '666', '777', '888', '999', '101010', '111111', 'skb'];
		var isReseted = false;

		function procSignal(signal, value) {
			if (signal == 'scramble') {
				currentScrambleType = value[0];
				currentScramble = value[1];
				var puzzleType = tools.puzzleType(currentScrambleType);
				for (var size = 12; size > 0; size--) {
					if (types[size] == puzzleType) {
						if (currentScrambleSize != size) {
							currentScrambleSize = size
							isReseted = false;
							reset();
						}
						break;
					}
				}
				var m = value[0].match(/^r(\d)\d*$/);
				if (m) {
					currentScramble = currentScramble.split('\n');
					currentScramble.len = currentScramble.length;
					if (currentScrambleSize != ~~m[1]) {
						currentScrambleSize = ~~m[1];
						isReseted = false;
						reset();
					}
				}
			}
		}

		var div = $('<div />');
		var isEnable = false;

		function setEnable(enable) {
			isEnable = enable;
			enable ? div.show() : div.hide();
			if (enable) {
				load();
			}
		}

		function setSize(value) {
			div.css('height', value * $('#logo').width() / 9 + 'px');
			twistyScene && twistyScene.resize();
		}

		$(function() {
			regListener('timer', 'scramble', procSignal);
			div.appendTo("#container");
		});
		return {
			onkeydown: onkeydown,
			setEnable: setEnable,
			setSize: setSize,
			reset: reset
		}
	})();


	var giikerTimer = (function() {

		var enable = false;
		var enableVRC = false;
		var waitReadyTid = 0;
		var moveReadyTid = 0;
		var insTime = 0;
		var div = $('<div />');
		var totPhases = 1;
		var currentFacelet = mathlib.SOLVED_FACELET;
		var moveCnt;
		var lastAxes = 0;

		var giikerVRC = (function() {
			var twistyScene;
			var twisty;
			var isReseted = false;
			var isLoading = false;
			var curVRCCubie = new mathlib.CubieCube();
			var tmpCubie1 = new mathlib.CubieCube();
			var tmpCubie2 = new mathlib.CubieCube();

			function resetVRC(temp) {
				if (twistyScene == undefined || isReseted || !enableVRC) {
					return;
				}
				isReseted = true;
				twistyScene.initializeTwisty({
					type: "cube",
					faceColors: [0xffffff, 0xff0000, 0x00ff00, 0xffff00, 0xff9000, 0x0000ff], // U L F D L B
					dimension: 3,
					stickerWidth: 1.7,
					scale: 0.9
				});
				curVRCCubie.fromFacelet(mathlib.SOLVED_FACELET);
				twisty = twistyScene.getTwisty();
				if (!temp) {
					setSize(getProp('timerSize'));
				}
			}

			function setSize(value) {
				div.css('height', value * $('#logo').width() / 9 + 'px');
				twistyScene && twistyScene.resize();
			}

			function initVRC() {
				if (twistyScene != undefined) {} else if (window.twistyjs != undefined) {
					twistyScene = new twistyjs.TwistyScene();
					div.empty().append(twistyScene.getDomElement());
					resetVRC();
					twistyScene.resize();
					isLoading = false;
				} else if (!isLoading && document.createElement('canvas').getContext) {
					$.getScript("js/twisty.js", initVRC);
					isLoading = true;
				} else {
					div.css('height', '');
					div.html('--:--');
				}
			}

			function setState(state, prevMoves, isFast) {
				tmpCubie1.fromFacelet(state);
				var todoMoves = [];
				var shouldReset = true;
				for (var i = 0; i < prevMoves.length; i++) {
					todoMoves.push(prevMoves[i]);
					var m = "URFDLB".indexOf(prevMoves[i][0]) * 3 + "'2 ".indexOf(prevMoves[i][1]);
					if (!(m >= 0 && m < 18)) {
						continue;
					}
					mathlib.CubieCube.EdgeMult(tmpCubie1, mathlib.CubieCube.moveCube[m], tmpCubie2);
					mathlib.CubieCube.CornMult(tmpCubie1, mathlib.CubieCube.moveCube[m], tmpCubie2);
					var tmp = tmpCubie1;
					tmpCubie1 = tmpCubie2;
					tmpCubie2 = tmp;
					if (tmpCubie1.isEqual(curVRCCubie)) {
						shouldReset = false;
						break;
					}
				}
				if (shouldReset) { //cannot get current state according to prevMoves
					resetVRC(false);
					curVRCCubie.fromFacelet(mathlib.SOLVED_FACELET);
					todoMoves = scramble_333.genFacelet(state);
				} else {
					todoMoves = todoMoves.reverse().join(' ');
				}
				if (todoMoves.match(/^\s*$/)) {
					scramble = [];
				} else {
					scramble = twisty.parseScramble(todoMoves);
				}
				if (scramble.length < 5) {
					twistyScene.addMoves(scramble);
				} else {
					twistyScene.applyMoves(scramble);
				}
				isReseted = false;
				curVRCCubie.fromFacelet(state);
			}

			return {
				resetVRC: resetVRC, //reset to solved
				initVRC: initVRC,
				setState: setState,
				setSize: setSize
			}
		})();

		function clearReadyTid() {
			if (waitReadyTid) {
				clearTimeout(waitReadyTid);
				waitReadyTid = 0;
			}
			if (moveReadyTid) {
				clearTimeout(moveReadyTid);
				moveReadyTid = 0;
			}
		}

		function giikerCallback(facelet, prevMoves, now) {
			currentFacelet = facelet;
			if (!enable) {
				return;
			}
			if (enableVRC) {
				giikerVRC.setState(facelet, prevMoves, false);
			}
			var curAxis = "URFDLB".indexOf(prevMoves[0][0]);
			if ((lastAxes & (0x20 >> curAxis)) == 0) {
				lastAxes = lastAxes & (0x124 >> curAxis) | (0x20 >> curAxis);
				moveCnt++;
			}
			clearReadyTid();
			if (status == -1) {
				if (facelet != mathlib.SOLVED_FACELET) {
					var delayStart = getProp('giiSD');
					if (delayStart == 's') {
						//according to scramble
						if (giikerutil.checkScramble()) {
							markScrambled(now);
						}
					} else if (delayStart != 'n') {
						waitReadyTid = setTimeout(function() {
							markScrambled(now);
						}, ~~delayStart * 1000);
					}
					var moveStart = getProp('giiSM');
					if (moveStart != 'n') {
						var movere = {
							'x4': /^([URFDLB][ '])\1\1\1$/,
							'xi2': /^([URFDLB])( \1'\1 \1'|'\1 \1'\1 )$/
						}[moveStart];
						if (movere.exec(prevMoves.join(''))) {
							moveReadyTid = setTimeout(function() {
								markScrambled(now);
							}, 1000);
						}
					}
				}
			} else if (status == -3 || status == -2) {
				if (checkUseIns()) {
					insTime = now - startTime;
				} else {
					insTime = 0;
				}
				startTime = now;
				status = nPhases[getProp('vrcMP', 'n')];
				totPhases = status;
				curTime = [insTime > 17000 ? -1 : (insTime > 15000 ? 2000 : 0)];
				lcd.fixDisplay(false, true);
				lcd.setRunning(true, enableVRC);
				ui.setAutoShow(false);
			}
			if (status >= 1) {
				var curProgress = cubeutil.getProgress(facelet, kernel.getProp('vrcMP', 'n'));
				if (curProgress < status) {
					for (var i = status; i > curProgress; i--) {
						curTime[i] = now - startTime;
					}
				}
				status = Math.min(curProgress, status) || 1;
				lcd.setStaticAppend(lcd.getMulPhaseAppend(status, totPhases));
				if (facelet == mathlib.SOLVED_FACELET) {
					status = -1;
					curTime[1] = now - startTime;
					ui.setAutoShow(true);
					lcd.setRunning(false, enableVRC);
					lcd.fixDisplay(false, true);
					lcd.val(curTime[1], enableVRC);
					lcd.append(lcd.getMulPhaseAppend(0, totPhases));
					lcd.append('<div style="font-family: Arial; font-size: 0.5em">' + moveCnt + " moves<br>" + ~~(100000 * moveCnt / curTime[1]) / 100.0 + " fps" + "</div>");
					if (curTime[1] != 0) {
						pushSignal('time', curTime);
					}
				}
			}
		}

		function markScrambled(now) {
			clearReadyTid();
			if (status == -1) {
				status = -2;
				startTime = now;
				moveCnt = 0;
				lcd.fixDisplay(true, true);
				if (checkUseIns()) {
					lcd.setRunning(true, enableVRC);
				}
				ui.setAutoShow(false);
				if (getProp('giiBS')) {
					metronome.playTick();
				}
			}
		}

		function setVRC(enable) {
			enableVRC = enable;
			enable ? div.show() : div.hide();
			if (enable) {
				giikerVRC.initVRC();
			}
		}

		$(function() {
			div.appendTo("#container");
		});

		return {
			setEnable: function(input) { //s: stackmat, m: moyu
				enable = input == 'g';
				if (enable) {
					giikerutil.setCallBack(giikerCallback);
					var ret = giikerutil.init();
					if (ret) {
						ret.then($.noop, function(error) {
							if (error.code == error.SECURITY_ERR) {
								kernel.showDialog([$('<div>Press OK To Connect To Giiker Cube</div>'), function() {
									giikerutil.init().then($.noop, console.log);
								}, 0, 0], 'share', 'Giiker Connect');
							}
						});
					}
				} else {
					GiikerCube.stop();
				}
				setVRC(enable && getProp('giiVRC'));
			},
			onkeydown: function(keyCode) {
				if (keyCode == 27) {
					clearReadyTid();
					status = -1;
					ui.setAutoShow(true);
					lcd.val(0, enableVRC);
					lcd.setRunning(false, enableVRC);
					lcd.fixDisplay(false, true);
				} else if (keyCode == 32 && getProp('giiSK') && currentFacelet != mathlib.SOLVED_FACELET) {
					if (status == -1) {
						markScrambled($.now());
					}
				}
			},
			setVRC: setVRC,
			setSize: giikerVRC.setSize
		}
	})();

	function onkeydown(keyCode) {
		if (ui.isPop()) {
			return;
		}
		var focusObj = $(document.activeElement);
		if (focusObj.is('input, textarea, select')) {
			if (getProp('input') == 'i' && focusObj.prop('id') == 'inputTimer' && keyCode == 13) {
				inputTimer.parseInput();
			}
			return;
		} else {
			focusObj.blur();
		}
		switch (getProp('input')) {
			case 't':
				keyboardTimer.onkeydown(keyCode);
				break;
			case 's':
				stackmatTimer.onkeydown(keyCode);
			case 'i':
				break;
			case 'v':
				virtual333.onkeydown(keyCode);
				break;
			case 'g':
				giikerTimer.onkeydown(keyCode);
				break;
		}
	}

	function onkeyup(keyCode) {
		if (ui.isPop()) {
			return;
		}
		var focusObj = $(document.activeElement);
		if (focusObj.is('input, textarea, select')) {
			if (getProp('input') == 'i' && focusObj.prop('id') == 'inputTimer' && keyCode == 13) {
				inputTimer.clear();
			}
			return;
		} else {
			focusObj.blur();
		}
		switch (getProp('input')) {
			case 't':
				keyboardTimer.onkeyup(keyCode);
				break;
			case 's':
				stackmatTimer.onkeyup(keyCode);
				break;
		}
	}

	var resetCondition = "input|phases|scrType|preScr|useMilli|smallADP|giiVRC".split('|');

	$(function() {
		container = $('#container');
		regListener('timer', 'property', function(signal, value) {
			if (value[0] == 'timerSize') {
				container.css('font-size', value[1] + 'em');
				virtual333.setSize(value[1]);
				giikerTimer.setSize(value[1]);
			}
			if (value[0] == 'timerSize' || value[0] == 'phases') {
				$('#multiphase').css('font-size', getProp('timerSize') / Math.max(getProp('phases'), 4) + 'em')
			}
			if (value[0] == 'input') {
				stackmatTimer.setEnable(value[1]);
				giikerTimer.setEnable(value[1]);
			}
			if (value[0] == 'showAvg') {
				avgDiv.showAvgDiv(value[1]);
			}
			if (value[0] == 'giiVRC' && value[2] != 'set') {
				giikerTimer.setEnable(getProp('input'));
			}
			if ($.inArray(value[0], resetCondition) != -1) {
				reset();
			}
		}, /^(?:input|phases|scrType|preScr|timerSize|showAvg|useMilli|smallADP|giiVRC)$/);
		regProp('timer', 'useMouse', 0, PROPERTY_USEMOUSE, [false]);
		regProp('timer', 'useIns', 1, PROPERTY_USEINS, ['n', ['a', 'b', 'n'], PROPERTY_USEINS_STR.split('|')]);
		regProp('timer', 'voiceIns', 1, PROPERTY_VOICEINS, ['1', ['n', '1', '2'], PROPERTY_VOICEINS_STR.split('|')]);
		regProp('timer', 'input', 1, PROPERTY_ENTERING, ['t', ['t', 'i', 's', 'm', 'v', 'g'], PROPERTY_ENTERING_STR.split('|')]);
		regProp('timer', 'timeU', 1, PROPERTY_TIMEU, ['c', ['u', 'c', 's', 'i', 'n'], PROPERTY_TIMEU_STR.split('|')]);
		regProp('timer', 'preTime', 1, PROPERTY_PRETIME, [300, [0, 300, 550, 1000],
			['0', '0.3', '0.55(stackmat)', '1']
		]);
		regProp('timer', 'phases', 2, PROPERTY_PHASES, [1, 1, 10]);
		regProp('ui', 'showAvg', 0, SHOW_AVG_LABEL, [true]);
		regProp('ui', 'timerSize', 2, PROPERTY_TIMERSIZE, [20, 1, 100]);
		regProp('ui', 'smallADP', 0, PROPERTY_SMALLADP, [true]);

		regProp('vrc', 'vrcMP', 1, PROPERTY_VRCMP, ['n', ['n', 'cfop', 'fp', 'cf4op', 'roux'], PROPERTY_VRCMPS.split('|')]);
		regProp('vrc', 'giiVRC', 0, PROPERTY_GIIKERVRC, [true]);
		regProp('vrc', 'giiSD', 1, PROPERTY_GIISOK_DELAY, ['s', ['2', '3', '4', '5', 'n', 's'], PROPERTY_GIISOK_DELAYS.split('|')]);
		regProp('vrc', 'giiSK', 0, PROPERTY_GIISOK_KEY, [true]);
		regProp('vrc', 'giiSM', 1, PROPERTY_GIISOK_MOVE, ['n', ['x4', 'xi2', 'n'], PROPERTY_GIISOK_MOVES.split('|')]);
		regProp('vrc', 'giiBS', 0, PROPERTY_GIISBEEP, [true]);
		regProp('vrc', 'giiRST', 1, PROPERTY_GIIRST, ['p', ['a', 'p', 'n'], PROPERTY_GIIRSTS.split('|')]);
		regProp('vrc', 'giiAED', 0, PROPERTY_GIIAED, [false]);
	});

	var fobj;

	function refocus() {
		if (fobj != undefined) {
			fobj.focus();
		} else {
			document.activeElement.blur();
		}
	}

	return {
		onkeydown: onkeydown,
		onkeyup: onkeyup,
		showAvgDiv: avgDiv.showAvgDiv,
		refocus: refocus
	};
})(kernel.regListener, kernel.regProp, kernel.getProp, kernel.pretty, kernel.ui, kernel.pushSignal);