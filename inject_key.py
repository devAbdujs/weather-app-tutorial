import pty
import os
import sys

ip = '192.168.43.216'
user = 'abdulwahid'
password = 'lalaqwk12'

command = f'ssh-copy-id -o StrictHostKeyChecking=no {user}@{ip}'

pid, fd = pty.fork()

if pid == 0:
    os.execvp('sh', ['sh', '-c', command])
else:
    while True:
        try:
            data = os.read(fd, 1024)
            if not data:
                break
            # print(data.decode(errors='ignore'), end='')
            if b'password:' in data.lower():
                os.write(fd, password.encode() + b'\n')
        except OSError:
            break
    os.waitpid(pid, 0)
    print("SSH Key Injection Complete")
