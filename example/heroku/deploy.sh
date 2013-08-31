PNODE_DEMO_APP=pnode-demo

if [ ! $PNODE_DEMO_APP ]
then
  echo "fill in a PNODE_DEMO_APP name"
  exit 1
fi


git init
git remote add heroku git@heroku.com:$PNODE_DEMO_APP.git
git pull heroku master
