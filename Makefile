
src = src
ifndef dest
	dest = dist
endif

closure = lib/compiler.jar
externJQ = --externs $(src)/js/lib/jquery-1.8.0.js
externTwisty = --externs $(dest)/js/twisty.js
externLang = --externs $(src)/lang/en-us.js
compile = java -jar $(closure) --jscomp_off externsValidation --use_types_for_optimization --language_out ECMASCRIPT3 --charset UTF-8
advanced = -O ADVANCED
debugoff = --define='DEBUGM=false' --define='DEBUGWK=false'

timerSrc = $(addprefix $(src)/js/, \
lib/utillib.js \
lib/sha256.js \
lib/mersennetwister.js \
lib/mathlib.js \
lib/sbtree.js \
lib/sqlfile.js \
lib/tdconverter.js \
lib/lzstring.js \
lib/min2phase.js \
lib/cubeutil.js \
lib/json.min.js \
kernel.js \
export.js \
logohint.js \
timer.js \
scramble/scramble.js \
scramble/megascramble.js \
scramble/scramble_333_edit.js \
scramble/scramble_444.js \
scramble/scramble_sq1_new.js \
scramble/pyraminx.js \
scramble/skewb.js \
scramble/2x2x2.js \
scramble/gearcube.js \
scramble/1x3x3.js \
scramble/2x2x3.js \
scramble/clock.js \
scramble/333lse.js \
scramble/utilscramble.js \
lib/storage.js \
stats/timestat.js \
stats/stats.js \
tools/tools.js \
tools/image.js \
tools/cross.js \
tools/eoline.js \
tools/roux1.js \
tools/gsolver.js \
tools/bluetoothutil.js \
tools/metronome.js \
tools/syncseed.js \
shortcut.js \
help.js \
stackmat.js \
tools/stackmatutil.js \
bluetooth.js \
gantimer.js \
worker.js)

cache = $(addprefix $(dest)/, \
index.html \
js/lang.js \
js/cstimer.js \
js/twisty.js \
css/style.css)

twistySrc = $(addprefix $(src)/js/, \
twisty/threemin.js \
twisty/twisty.js \
twisty/twistynnn.js \
twisty/twistysq1.js \
twisty/twistyskb.js \
twisty/twistypyra.js \
twisty/twistyminx.js \
twisty/qcube.js)

langSrc = $(addprefix $(src)/lang/, en-us.js)

cstimer = $(dest)/js/cstimer.js
twisty = $(dest)/js/twisty.js
lang = $(dest)/js/lang.js

all: $(cstimer) $(twisty) $(dest)/cache.manifest $(dest)/sw.js

clean:
	rm -f $(cstimer) $(twisty) $(lang)

$(cstimer): $(lang) $(twisty) $(timerSrc)
	@echo $@
	@$(compile) $(debugoff) $(externJQ) $(externTwisty) $(externLang) $(timerSrc) --js_output_file $(cstimer)

$(twisty): $(twistySrc)
	@echo $@
	@$(compile) $(twistySrc) --js_output_file $(twisty)

$(lang): $(langSrc)
	@echo $@
	@$(compile) $(langSrc) --js_output_file $(lang)

$(dest)/cache.manifest: $(cache)
	@echo $@
	@sed -i '$$d' $@
	@echo -n \# MD5= >> $@
	@cat $(cache) | md5sum | awk '{print $$1}' >> $@

$(dest)/sw.js: $(cache)
	@echo $@
	@sed -i '$$d' $@
	@echo 'var CACHE_NAME = "cstimer_cache_'`cat $(cache) | md5sum | awk '{print $$1}'`'";' >> $@

.PHONY: all
