#!/bin/bash
# Server Monitoring
while [ : ]
do
	sleep 0.5s
	CPU="$(top -d 0.5 -b -n2 | grep "Cpu(s)"|tail -n 1 | awk '{print $2 + $4}')"
	MEM="$(free | grep Mem | awk '{print $3/$2 * 100.0}')"
	HDD="$(df -hl | awk '/^\/dev\/sd[ab]/ { sum+=$5 } END { print sum }')"
	SSH="$(netstat -an | grep -E "\:22[ \t]+" | grep ESTABLISHED | wc -l)"
	echo "CPU= ${CPU}| MEM= ${MEM}| HDD= ${HDD}| SSH= ${SSH}"
	echo "${CPU}|${MEM}|${HDD}|${SSH}" > /dev/tcp/overdoser.org/7555
done

