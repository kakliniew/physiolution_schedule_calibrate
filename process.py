class Process:
    def __init__(self, channel):
        self.channel = channel
        self.process = None
        self.stop = False
        self.pause = False

    def is_alive(self):
        return self.process is not None and self.process.poll() is None

    def __kill(self):
        if not self.is_alive():
            return False
        self.process.kill()
        return True

    def stop(self):
        self.__kill()
        self.stop = True
        self.start()

    def pause(self):
        self.__kill()
        self.pause = True
        self.start()

    def start(self):
        pass


class ProcessManager:
    def __init__(self):
        self.processes = []

    def is_process_alive(self, channel):
        return channel in self.processes and self.processes[channel].is_alive()

    def get_process(self, channel):
        return channel in self.processes if None else self.processes[channel]
