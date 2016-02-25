var Converter = require("csvtojson").Converter;
var cardsConverter = new Converter({});
var historyConverter = new Converter({});
var _ = require('lodash');
var moment = require('moment');

//end_parsed will be emitted once parsing finished 
cardsConverter.on("end_parsed", function (cardsArray) {
   //console.log(cardsArray); //here is your result jsonarray 

	historyConverter.on("end_parsed", function (historyArray) {
		
		// посчитать время за которое мы делаем N задач. За неделю мы делаем столько то пойнтов
		// 1. находим все карты, перешедшие в Ready for UAT за неделю
		// 2. оставляем только уникальные
		// 3. джойним с card description
		// 3. суммируем количество пойнтов

		var startDate = new Date('2016-02-15');
		var endDate = new Date('2016-02-21');
		var finishedLine = 'Ready for UAT: BG 2.9';
		var finishedByWeek = findCardsInTimeRangeAndColumn(startDate, endDate, finishedLine, historyArray);
	  console.log(finishedByWeek.length); //here is your result jsonarray 

	});

});
 
 function findCardsInTimeRangeAndColumn(startDate, endDate, columnName, historyArray) {
 	return _.filter(historyArray, function(o) {
 		var currentDate = o.When.toLowerCase();
 		// console.log(currentDate);
 		var toLane = 'To Lane';
		var whenDate = new Date(moment(currentDate, 'MM/DD/YYYY [at] hh:mm:ss A').format());
		var correctDate = false;
		console.log(o[toLane]);
 		if(whenDate>=startDate && whenDate <=endDate)
 			correctDate = true; 
 		if(correctDate && o[toLane] === columnName){
 			return true;
 		}else{
 			return false;
 		}
 	});
 }

//read from file 
require("fs").createReadStream("./cards.csv").pipe(cardsConverter);
require("fs").createReadStream("./eventsexport.csv").pipe(historyConverter);