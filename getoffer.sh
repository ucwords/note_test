#!/bin/bash
export PATH=$PATH:/usr/local/bin  #在这里指定一下Node的可执行程序安装目录，我的是/usr/local/bin
export NODE_PATH=$NODE_PATH:/usr/local/lib/node_modules  #这里是Node类库的路径
#往下的内容就不用修改了
DIR=/data/www/lean_getOffer/
npm=npm
cd DIR
case "$1" in
    start)
        $npm start 
        ;;
    stop)
        $npm stop
        ;;
    stopall)
        $npm stopall
        ;;
    restartall)
        $npm restartall
        ;;
    reload|restart)
        $npm restart
        ;;
    list)
        $npm list
        ;;
    *)
        echo "Usage: getoffer.sh {start|stop|restart|reload|stopall|restartall|list}"
        exit 1
        ;;
esac