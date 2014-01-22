

# node server 5000 5001 localhost:6001 localhost:7001 &
# node server 6000 6001 &
# node server 7000 7001 &
sleep 2

echo "retrieving user from 7000..."
# curl --dump-header cookies.txt http://localhost:7000/
# sleep 1
# echo "\n"
# echo "logging in from 6000..."
# curl --cookie cookies.txt  http://localhost:6000/login
# sleep 1
# echo "\n"
# echo "retrieving user from 5000..."
# curl --cookie cookies.txt http://localhost:5000/
# sleep 1
# echo "\n"
# echo "retrieving user from 7000..."
# curl --cookie cookies.txt http://localhost:7000/
# sleep 1
# echo "\n"
# echo "logging out from 7000..."
# curl --cookie cookies.txt http://localhost:7000/logout
# sleep 1
# echo "\n"
# echo "retrieving user from 6000..."
# curl --cookie cookies.txt http://localhost:6000/
# sleep 1
# echo "\n"
# echo "retrieving user from 5000..."
# curl --cookie cookies.txt http://localhost:5000/
# echo
# rm cookies.txt

# sleep 1
# killall node