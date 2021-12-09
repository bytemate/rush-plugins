SHELL=/bin/bash

CURRENT_BRANCH_NAME := $(shell git branch --show-current)

publish:
	rush publish --apply --publish --target-branch $(CURRENT_BRANCH_NAME)
