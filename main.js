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

		var startDate = new Date('2015-11-01');
		var endDate = new Date('2016-02-21');
		getWeeklyStats(startDate, historyArray);

	});

});
 
function getWeeklyStats(startDate, historyArray) {
		// var finishedLine = 'Quality Assurance: Done';
		var finishedLine = 'Ready for UAT: BG 2.9';
		var currentDate = startDate;
		var i = 0;
		var days = 7;
		var now = new Date();
		while(currentDate<=now){
			
			var endDate = new Date(currentDate);
    	endDate.setDate(endDate.getDate() + days);
			console.log(currentDate);
			console.log(endDate);
			
			var finishedByWeek = findCardsInTimeRangeAndColumn(currentDate, endDate, finishedLine, historyArray);
			finishedByWeek = _.uniqBy(finishedByWeek, 'Card Id');
			// console.log(finishedByWeek);
	  	console.log(i + ':' + finishedByWeek.length); //here is your result jsonarray 
			currentDate = new Date(endDate);
			i++;
		}
		
}

 function findCardsInTimeRangeAndColumn(startDate, endDate, columnName, historyArray) {
 	return _.filter(historyArray, function(o) {
 		var currentDate = o.When.toLowerCase();
 		// console.log(currentDate);
 		var toLane = 'To Lane';
		var whenDate = new Date(moment(currentDate, 'MM/DD/YYYY [at] hh:mm:ss A').format());
		var correctDate = false;
		// console.log(o);
 		if(whenDate>=startDate && whenDate <=endDate)
 			correctDate = true; 
 		if(correctDate && o[toLane] === columnName){
 			// console.log(o['Card Id']);
 			return true;
 		}else{
 			return false;
 		}
 	});
 }

//read from file 
require("fs").createReadStream("./cards.csv").pipe(cardsConverter);
require("fs").createReadStream("./eventsexport.csv").pipe(historyConverter);