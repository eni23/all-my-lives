#
# Makefile for Sensorbox-Firmware
# (Project: All my Lives)
#
# Author: Cyrill vW < eni@e23.ch >
#
# !! do not edit with a graphical editor. use vim instead. !!
#

PROJECT_DIR				= $(dir $(abspath $(lastword $(MAKEFILE_LIST))))
ARDUINO_DIR				= /home/eni/progs/arduino-1.6.5-esp
SRCDIR					= $(PROJECT_DIR)src
OBJDIR					= $(PROJECT_DIR)build
MAINFILE				= main.ino
VERSIONTPL				= aml-sensorbox-version.tpl.h
VERSIONFILE				= aml-sensorbox-version.h
VERSIONREPL				= {GIT_TAGID}

BOARD					= nodemcu
CPU_FREQ				= 80
FLASH_SIZE				= 4M
FLASH_SIZE_BYTE				= 4096000
UPLOAD_BAUD				= 921600
MONITOR_BAUD				= 115200
SERIAL_DEVICE				= /dev/ttyUSB*
PREFSTXT				= $(PROJECT_DIR)arduino/preferences.txt

# end of configurable stuff
BOARDPARAMS = esp8266com:esp8266:$(BOARD):UploadSpeed=$(UPLOAD_BAUD)
ifneq ($(BOARD), 'nodemcu')
	BOARDPARAMS := $(BOARDPARAMS:,FlashSize=$(FLASH_SIZE))
endif

ACMD = $(ARDUINO_DIR)/arduino --verbose --preserve-temp-files --pref build.path=$(OBJDIR) --board $(BOARDPARAMS) --preferences-file $(PREFSTXT)
ESPTOOL=$(ARDUINO_DIR)/hardware/esp8266com/esp8266/tools/esptool
ELF00=$(OBJDIR)/main.cpp_00000.bin
ELF01=$(OBJDIR)/main.cpp_10000.bin
SKETCH_NAME=$(basename $(MAINFILE))
SRCTMP=$(join $(OBJDIR)/sketch/,$(SKETCH_NAME))
MAIN=$(join $(SRCTMP)/,$(MAINFILE))

COLORIZE=3>&1 1>&2 2>&3 | xargs -0 -I{} echo -e "\e[01;31m{}\e[0m"
GREENTEXT= | xargs -0 -I{} echo -e "\e[01;32m{}\e[0m"

.PHONY: version verify find-serial update-temp clean monitor upload

default: verify

version:
	$(eval GITTAG=$(shell git log --pretty=format:'%h' --abbrev-commit --date=short -1))
	mv $(OBJDIR)/sketch/$(SKETCH_NAME)/$(VERSIONTPL) $(OBJDIR)/sketch/$(SKETCH_NAME)/$(VERSIONFILE)
	sed -i "s/$(VERSIONREPL)/$(GITTAG)/g" $(OBJDIR)/sketch/$(SKETCH_NAME)/$(VERSIONFILE)

find-serial:
	@ls -1 $(SERIAL_DEVICE)
	$(eval USBTTY=$(shell ls -1 $(SERIAL_DEVICE) 2>/dev/null | head -n1 ))

update-temp:
	mkdir -p $(OBJDIR)/sketch/$(SKETCH_NAME)
	cp -r $(SRCDIR)/* $(OBJDIR)/sketch/$(SKETCH_NAME)

verify: update-temp version
	$(ACMD) --verify $(MAIN) | grep -v "JAVA_TOOL_OPTIONS" $(COLORIZE)
	touch $(OBJDIR)/.gitkeep

upload: find-serial
	$(ESPTOOL) -vv -cd ck -cb $(UPLOAD_BAUD) -cp $(USBTTY) -ca 0x00000 -cf $(ELF00) -ca 0x10000 -cf $(ELF01)

upload-slow: find-serial
	$(ESPTOOL) -vv -cd ck -cb $(MONITOR_BAUD) -cp $(USBTTY) -ca 0x00000 -cf $(ELF00) -ca 0x10000 -cf $(ELF01)

upload-arduino: find-serial
	$(ACMD) --verbose-upload --pref serial.port=$(USBTTY) --upload $(MAIN) $(COLORIZE)

all: verify upload

clean:
	-rm -r $(OBJDIR)/*

monitor: find-serial
	screen $(USBTTY) $(MONITOR_BAUD)
