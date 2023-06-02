# You need ssh-agent enabled and with the passpharase already loaded
npm run build
scp -r ./build/* shamorn@homeserver.lc:/var/www/betterkeep-sv.homeserver.lc/html/


