var Converter = require("csvtojson").Converter;
var json2csv = require('json2csv');

var cardsConverter = new Converter({});
var historyConverter = new Converter({});
var _ = require('lodash');
var moment = require('moment');


// =====================================================================================
// =============== Extract =============================================================

//end_parsed will be emitted once parsing finished 
cardsConverter.on("end_parsed", function (cardsArray) {
   //console.log(cardsArray); //here is your result jsonarray 

	historyConverter.on("end_parsed", function (historyArray) {
		

// =====================================================================================
// =============== Transform ===========================================================

		// посчитать время за которое мы делаем N задач. За неделю мы делаем столько то пойнтов
		// 1. находим все карты, перешедшие в Ready for UAT за неделю
		// 2. оставляем только уникальные
		// 3. фильтруем по полям карточек

		var startDate = new Date('2016-07-11');
		var results = getFinishedCardsForTimePeriod(1, startDate, historyArray, 'TT Quality Assurance: Ready for QA');
		// var results = getFinishedCardsForTimePeriod(1, startDate, historyArray, 'UAT: Ready for UAT');
		// console.log(results);
		var joinedResults = joinCardsWithDescription(results, cardsArray);
		// console.log(joinedResults);

		var filteredFinishedCardsResults  = customFilter(joinedResults);

		var backlog = getBackLog(cardsArray);

		backlog = setFinishedDateToUnfinished(backlog);

		//console.log('backlog: ', backlog);
		var filteredResults = _.concat(filteredFinishedCardsResults, backlog);

		filteredResults = addCreatedDateForCards(filteredResults, historyArray, startDate);
		console.log("=================================");
		//console.log(filteredResults);

// =====================================================================================
// =============== Load ================================================================

		var exportArray = _.map(filteredResults, function(item, key) {
			return {
				'ID': item.ExternalCardID,
				'Card Name': item.Card_Title,
				'Estimate': item.Card_Size,
				'Date added': item['Date added'],
				'Finished at day': item['Finished at day']
			};
		});
		exportArray = _.sortBy(exportArray, 'ID');
		// console.log(exportArray);
		var fs = require('fs');
		var fields = ['ID', 'Card Name', 'Estimate', 'Date added', 'Finished at day'];
		
		var csv = json2csv({ data: exportArray, fields: fields });

		fs.writeFile('r-scrum.csv', csv, function(err) {
		  if (err) throw err;
		  console.log('file saved');
		});
	});

});



// =====================================================================================
// =====================================================================================

function setFinishedDateToUnfinished(backlog) {
	return  _.map(backlog, function(element) { 
		return _.extend({}, element, {'Finished at day': 'unfinished'});
	});
}

function getBackLog(cardsArray) {
 	var filteredResults = _.filter(cardsArray, function(card) {
		return cardMatchesBacklogFilter(card);
	});
	
 	return filteredResults;
} 


 function cardMatchesBacklogFilter(cardDesc) { //TODO: merge with cardMatchesFilter
 	// console.log('cardDesc:', cardDesc);
 	var matched = false;
 	if(cardDesc.Card_Type === 'UAT Feedback' && cardDesc.Card_Priority === 'Critical' && isCardUdone(cardDesc.Lane_Title)){
 		matched = true;
 	}

 	return matched;
 }

 function isCardUdone(lineTitle) { //TODO: merge with cardMatchesFilter
 	if(lineTitle === 'backlog:uat feedback' || lineTitle === 'sprint log' || lineTitle === 'development:in progress' || lineTitle === 'development:review'){
 		// console.log('???lineTitle: ', lineTitle)
 		return true;
 	}
 	return false;
 }

function customFilter(results) {
 	// console.log(cardsArray[0]);
 	// console.log(results[0]);
 	
	var filteredResults = _.filter(results, function(card) {
		return cardMatchesFilter(card);
	});
	
 	return filteredResults;
 }

 function cardMatchesFilter(cardDesc) { //TODO: merge with isCardUdone
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

function getFinishedCardsForTimePeriod(numOfDays,startDate, historyArray, finishedLine) {
	var result = [];
	var currentDate = startDate;
	var i = 0;
	var now = new Date();
	while(currentDate<=now){
		
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
	}
	return result;
}

 function findCardsInTimeRangeAndColumn(startDate, endDate, columnName, historyArray) {
 	return _.filter(historyArray, function(o) {
 		var currentDate = o.When.toLowerCase();
 		// console.log(currentDate);
 		var toLane = 'To Lane';
		var whenDate = new Date(moment(currentDate, 'MM/DD/YYYY [at] hh:mm:ss A').format());
		var correctDate = false;
		// console.log(o[toLane]);
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

 function addCreatedDateForCards(cards, historyArray, startDate) {
 	return _.map(cards, function(card) {
 		var createdDate = findCreatedDateForCardId(card['Card Id'], historyArray);
 		var momentDate =  moment(createdDate, 'MM/DD/YYYY [at] hh:mm:ss A');
 		if(momentDate.isValid()){
 			var createdDateObject = new Date(momentDate.format());
 			// console.log('???????? createdDateObject:', createdDateObject);
 			var timeDiff = createdDateObject.getTime() - startDate.getTime();
			var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
			diffDays = diffDays-1;
			if(diffDays<0){
				diffDays = 0;
			}
			// console.log(card.ExternalCardID);
			// console.log(diffDays);
 			card['Date added'] = diffDays;
 		}else{
 			card['Date added'] = 'unknown date';
 		}
 		
 		return card;
 	});
 }

function findCreatedDateForCardId(cardId, historyArray) {
	// console.log('cardId: ', cardId);
	var record = _.find(historyArray, {'What': 'Card Creation Event', 'Card Id': cardId});
	// console.log(record);
	var createdDate;
	if(!_.isNil(record)){
		createdDate = record.When;
	}
	return createdDate;
}


function joinCardsWithDescription(results, cardsDesc) {

	return _.map(results, function (cardHistory) {
		var fullCardDescr = cardDescriptionById(cardHistory['Card Id'], cardsDesc);
		return _.extend(cardHistory, fullCardDescr);
	});
}

//read from file 
require("fs").createReadStream("./cards.csv").pipe(cardsConverter);
require("fs").createReadStream("./eventsexport.csv").pipe(historyConverter);