var mysql = require('mysql');

var date1=new Date().getTime();
//连接mysql数据库
var connection = mysql.createConnection({
    host: '192.168.0.18',
    user: 'lancet-icu',
    password: 'lancet-icu@dfsoft',
    database: 'test3'
});

const Influx = require('influx');
//连接influx数据库
const influx = new Influx.InfluxDB({
    host: 'localhost',
    database: 'lancet-icu',
    schema: [{
        measurement: 'icu_device_raw_data',
        fields: {
            value: Influx.FieldType.STRING
        },
        tags: [
            'adapter_id', 'item_code'
        ]
    }]
});

//查询数据
var i = 0;
var cacheArray = [];
var query = connection.query("SELECT * FROM icu_device_raw_data where `COLLECT_TIME`<>'0000-00-00 00:00:00'");
query
    .on('error', function(err) {
        // Handle error, an 'end' event will be emitted after this as well
    })
    .on('fields', function(fields) {
        // the field packets for the rows to follow
    })
    .on('result', function(row) {
        // Pausing the connnection is useful if your processing involves I/O
        connection.pause();

        // processRow(row, function() {
        //     connection.resume();
        // });

        i = i + 1;
        console.log(i);
        cacheArray.push({
            measurement: 'icu_device_raw_data',
            tags: {
                'adapter_id': row.ADAPTER_ID,
                'item_code': row.ITEM_CODE
            },
            fields: {
                value: row.VALUE
            },
            timestamp: row.COLLECT_TIME
        });
        if (i==100000) {
            //写入influx数据
            influx.writePoints(cacheArray).then(() => {
                console.log("写入influx");
                cacheArray = [];
                i = 0;
                connection.resume();
            });
        } else {
            connection.resume();
        }
    })
    .on('end', function() {
        // all rows have been received
        console.log("查询结束!");
        if (cacheArray.length>0) {
            //写入influx数据
            influx.writePoints(cacheArray).then(() => {
                console.log("写入剩余influx");
                process.exit();
                var date2=new Date().getTime();
                console.log('整体时间: '+(date2-date1));
            });            
        } else {
            process.exit();
            var date2=new Date().getTime();
            console.log('整体时间: '+(date2-date1));
        }
    });