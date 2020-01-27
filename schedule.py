class Schedule:
    def __init__(self, schedule):
        self.schedule = schedule
        self.data = Schedule._convert_schedule(self.schedule)
        self.offset_time = 0

    def set_offset_index(self, index):
        self.offset_time = self.get_index_time(index)

    def set_offset_time(self, time):
        self.offset_time = time

    def get_index_time(self, index) -> int:
        if index >= len(self.data):
            raise ValueError("Index is bigger than data length")
        return self.data[index]["x"]

    def get_schedule(self):
        schedule = self.schedule[:]

        cut_time = 0
        index = 0
        while cut_time < self.offset_time and len(schedule) > :


    @staticmethod
    def _convert_schedule(schedule) -> []:
        data = []

        offset = 0
        for point in schedule:
            offset += point["x"] * 60
            data.append({
                "x": offset,
                "y": point["y"]
            })

        return data
