web: uvicorn server.main:app --host 0.0.0.0 --port $PORT & NODE_ENV=production APP_NAME=$HEROKU_APP_NAME npm start
worker: npm run build && npm run preview