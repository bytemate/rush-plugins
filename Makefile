SHELL=/bin/bash

CURRENT_BRANCH_NAME := $(shell git branch --show-current)

publish:
	@export NPM_AUTH_TOKEN=`cat ~/.npmrc | grep npmjs | grep _authToken | awk -F= '{print $$2}'`; \
	rush publish --apply --publish --target-branch $(CURRENT_BRANCH_NAME)
