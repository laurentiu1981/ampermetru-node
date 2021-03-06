#!/bin/bash
# Server Monitoring

# Use this and the lines bellow to keep permanent socket
#exec 5<>/dev/tcp/overdoser.org/7555
if [ "$(uname -s)" = "Linux" ]
then
	while [ : ]
	do
		sleep 1s
		CPU="$(top -d 0.5 -b -n2 | grep "Cpu(s)"|tail -n 1 | awk '{print $2 + $4}')"
		MEM="$(free | grep Mem | awk '{print $3/$2 * 100.0}')"
		HDD="$(df -h / | awk '/^\/dev\// { print substr($5, 1, length($5)-1) }')"
		SSH="$(netstat -an | grep -E "\:22[ \t]+" | grep ESTABLISHED | wc -l)"
		echo "CPU= ${CPU}| MEM= ${MEM}| HDD= ${HDD}| SSH= ${SSH} | HOST= $(hostname)"
		#echo -n "${CPU}|${MEM}|${HDD}|${SSH}|$(hostname)" >&5
		echo -n "${CPU}|${MEM}|${HDD}|${SSH}|$(hostname)" >/dev/tcp/overdoser.org/7555
	done
elif [ "$(uname -s)" = "Darwin" ]
then
	while [ : ]
	do
		sleep 1s
		CPU="$(top -l 1 | grep "CPU usage" | tail -n 1 | awk '{print $3 + $5}')"
		MEM="$(./mac_mem.rb)"
		HDD="$(df -h / | awk '/^\/dev\// { print substr($5, 0, length($5)-1) }')"
		SSH="$(netstat -an | grep -E "\:22[ \t]+" | grep ESTABLISHED | wc -l)"
		echo "CPU= ${CPU}| MEM= ${MEM}| HDD= ${HDD}| SSH= ${SSH} | HOST= $(hostname)"
		#echo -n "${CPU}|${MEM}|${HDD}|${SSH}|$(hostname)" >&5
		echo -n "${CPU}|${MEM}|${HDD}|${SSH}|$(hostname)" >/dev/tcp/overdoser.org/7555
	done
fi
