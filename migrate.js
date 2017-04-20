#!/usr/bin/env node

"use strict"

var async = require('async');
var fs = require('fs');
var path = require('path');

Object.defineProperty(Date.prototype, "format", {
    value: function (format) {
        var date = this;

        var result = "";

        if (!format) {

            format = ""

        }

        var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September",
            "October", "November", "December"];

        if (format.match(/YYYY\-mm\-dd/)) {

            result = date.getFullYear() + "-" + padZeros((parseInt(date.getMonth()) + 1), 2) + "-" + padZeros(date.getDate(), 2);

        } else if (format.match(/mmm\/d\/YYYY/)) {

            result = months[parseInt(date.getMonth())] + "/" + date.getDate() + "/" + date.getFullYear();

        } else if (format.match(/d\smmmm,\sYYYY/)) {

            result = date.getDate() + " " + monthNames[parseInt(date.getMonth())] + ", " + date.getFullYear();

        } else {

            result = date.getDate() + "/" + months[parseInt(date.getMonth())] + "/" + date.getFullYear();

        }

        return result;
    }
});

function padZeros(number, positions) {
    var zeros = parseInt(positions) - String(number).length;
    var padded = "";

    for (var i = 0; i < zeros; i++) {
        padded += "0";
    }

    padded += String(number);

    return padded;
}

	function queryRaw(sql, callback) {

        var config = require(__dirname + "/database.json");

        var knex = require('knex')({
            client: 'mysql',
            connection: {
                host: config.host,
                user: config.username,
                password: config.password,
                database: config.database
            },
            pool: {
                min: 0,
                max: 500
            }
        });

        knex.raw(sql)
            .then(function (result) {

                callback(result);

            })
            .catch(function (err) {

                console.log(err.message);

                callback(err);

            });

        knex.destroy(sql);    

    }

    var file = path.resolve(".", "dump.sql");

    if (fs.existsSync(file)){

    	fs.unlinkSync(file);

    }

	var sql = "SELECT DISTINCT patient_id, DATE(date_enrolled) AS date_enrolled, creator, location_id FROM patient_program WHERE program_id IN (SELECT program_id FROM program WHERE name = 'CHRONIC CARE PROGRAM') AND voided = 0"

	queryRaw(sql, function(data) {

		if (data && data[0] && data[0].length > 0) {
			var ids = data[0];

			for(var i = 0; i < ids.length; i++) {

				var patient = ids[i];

				var sql = "INSERT INTO patient_program(patient_id, program_id, date_enrolled, creator, date_created, uuid, location_id) VALUES(\"" + patient.patient_id + "\", (SELECT program_id FROM program where name = \"DIABETES PROGRAM\" Limit 1), \"" + (new Date(patient.date_enrolled)).format("YYYY-mm-dd") + "\", \"" + patient.creator + "\", NOW(), (SELECT UUID()), \"" + patient.location_id + "\" );\n\n";

				console.log(sql);

				fs.appendFileSync(file, sql);

				var sql = "SELECT @patient_program_id := last_insert_id();\n\n";

				fs.appendFileSync(file, sql);

				var sql = "UPDATE encounter SET patient_program_id = @patient_program_id WHERE patient_id = \"" + patient.patient_id + "\" AND DATE(encounter_datetime) >= DATE(\"" + (new Date(patient.date_enrolled)).format("YYYY-mm-dd") + "\");\n\n";

				fs.appendFileSync(file, sql);

				/*queryRaw(sql, function(data) {

					if(data && data[0]) {

						var patient_program_id = data[0].insertId;

						var sql = "UPDATE encounter SET patient_program_id = \"" + patient_program_id + "\" WHERE patient_id = \"" + patient.patient_id + "\" AND DATE(encounter_datetime) >= DATE(\"" + (new Date(patient.date_enrolled)).format("YYYY-mm-dd") + "\")";

						queryRaw(sql, function(data){

							console.log(data);

							callback();	

						})

					} else {

						callback();

					}


				})*/

			}

		}
	})