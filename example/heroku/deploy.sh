# script to setup heroku repo, update it, then tear it down

# SET THIS TO YOUR APP NAME
PNODE_DEMO_APP=pnode-demo

if [ ! $PNODE_DEMO_APP ]
then
  echo "fill in a PNODE_DEMO_APP name"
  exit 1
fi


git clone git@heroku.com:$PNODE_DEMO_APP.git heroku-tmp || exit 1

cp * heroku-tmp/
cd heroku-tmp
git add *
git commit -m 'updated'
git push
cd ..
rm -rf heroku-tmp
echo "======================="
echo "Heroku Deploy Complete!"
