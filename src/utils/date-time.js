const moduleName = "[utils]",
  config = require(`${__config}/config`),
  moment = require("moment"),
  logger = require(`${__utils}/logger/logger`)(moduleName),
  _ = require("underscore");

exports.timestamp = () => {
  return new Date();
};

exports.getMilliseconds = () => {
  return new Date().getTime();
};

exports.isDateGreater = (smaller, greater, time_unit) => {
  if (time_unit === "hour") {
    smaller = new Date(moment(smaller).format("DD-MMM-YYYY H")).getTime();
    greater = new Date(moment(greater).format("DD-MMM-YYYY H")).getTime();
    return smaller <= greater;
  } else if (time_unit === "day") {
    smaller = new Date(moment(smaller).format("DD-MMM-YYYY")).getTime();
    greater = new Date(moment(greater).format("DD-MMM-YYYY")).getTime();
    return smaller <= greater;
  } else {
    smaller = new Date(moment(smaller).format("YYYY-MM")).getTime();
    greater = new Date(moment(greater).format("YYYY-MM")).getTime();
    return smaller <= greater;
  }
};

exports.getMonthNamesByDate = (startDate, endDate, time_unit) => {
  let date = moment(startDate).format(),
    months = [];
  while (this.isDateGreater(date, endDate, time_unit)) {
    months.push(date);
    date = moment(date).add(1, "month");
  }
  return months;
};

exports.getDaysByDate = (startDate, endDate, time_unit) => {
  let date = moment(startDate).format(),
    days = [];
  while (this.isDateGreater(date, endDate, time_unit)) {
    days.push(date);
    date = moment(date).add(1, "day");
  }
  return days;
};

exports.getHoursByDate = (startDate, endDate, time_unit) => {
  let date = moment(startDate).format(),
    hours = [];
  while (this.isDateGreater(date, endDate, time_unit)) {
    hours.push(date);
    date = moment(date).add(1, "hour");
  }
  return hours;
};

exports.getDateRange = (startDate, endDate, defaultDate = true) => {
  let obj = {};
  if (defaultDate) {
    obj = {
      $gt: new Date(
        moment(
          moment()
            .subtract(
              config.DEFAULT_DATE_RANGE.difference,
              config.DEFAULT_DATE_RANGE.unit
            )
            .format()
        )
          .startOf("month")
          .format()
      ),
      $lt: new Date(moment().format()),
    };
  } else {
    obj = {
      $gt: new Date(parseInt(startDate)),
      $lt: new Date(parseInt(endDate)),
    };
  }

  return obj;
};

exports.getDateTimeList = (startDate, endDate, time_unit) => {
  if (time_unit === "hour")
    return this.getHoursByDate(startDate, endDate, time_unit);
  else if (time_unit === "day")
    return this.getDaysByDate(startDate, endDate, time_unit);
  else return this.getMonthNamesByDate(startDate, endDate, time_unit);
};
