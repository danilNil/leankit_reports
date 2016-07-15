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
		// 3. фильтруем по полям карточек

		var startDate = new Date('2016-07-11');
		var results = getStatsForTimePeriod(1,startDate, historyArray);
		console.log(results);
		var filteredResults  = customFilter(results, cardsArray);

		filteredResults = addCreatedDateForCards(filteredResults, historyArray);
		console.log("=================================");
		//console.log(filteredResults);
		_.each(filteredResults, function(item, key) {
			console.log(item.Card + ", " + item['Finished at day']);
		})
		
	});

});


function customFilter(results, cardsArray) {
 	// console.log(cardsArray[0]);
 	// console.log(results[0]);
 	
	var filteredResults = _.filter(results, function(card) {
		var cardDesc = cardDescriptionById(card['Card Id'], cardsArray);
		return cardMatchesFilter(cardDesc);
	});
	
 	return filteredResults;
 }

 function cardMatchesFilter(cardDesc) {
 	var matched = false;
 	if(cardDesc.Card_Type === 'UAT Feedback' && cardDesc.Card_Priority === 'Critical'){
 		matched = true;
 	}

 	return matched;
 }
 
 function cardDescriptionById(cardId, cardsArray) {
 	var result = _.find(cardsArray, ['Card_Id', cardId]);
 	return result;
 }

function getStatsForTimePeriod(numOfDays,startDate, historyArray) {
	var result = [];
	var finishedLine = 'UAT: Ready for UAT';
	var currentDate = startDate;
	var i = 0;
	var now = new Date();
	// while(currentDate<=now){
		
		var endDate = new Date(currentDate);
		endDate.setDate(endDate.getDate() + numOfDays);
		console.log(currentDate);
		console.log(endDate);
		
		var finished = findCardsInTimeRangeAndColumn(currentDate, endDate, finishedLine, historyArray);
		finished = _.uniqBy(finished, 'Card Id');
  		console.log(i + ':' + finished.length);
  		if(finished.length>0){
  			finished = _.map(finished, function(o) {
  				o['Finished at day'] = i;	
  				return o;
  			});	  		
	  		result = _.concat(result, finished);	
  		}
  		
		currentDate = new Date(endDate);
		i++;
	// }
	return result;
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

 function addCreatedDateForCards(cards, historyArray) {
 	return cards
 }

//read from file 
require("fs").createReadStream("./cards (6).csv").pipe(cardsConverter);
require("fs").createReadStream("./eventsexport.csv").pipe(historyConverter);