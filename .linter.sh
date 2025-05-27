#!/bin/bash
cd /home/kavia/workspace/code-generation/stockexplorer-16106-9f655f49/stock_explorer
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

