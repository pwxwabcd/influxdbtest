const Influx = require('influx');
const influx = new Influx.InfluxDB({
    host: 'localhost',
    database: 'mydb',
    schema: [{
        measurement: 'response_times',
        fields: {
            path: Influx.FieldType.STRING,
            duration: Influx.FieldType.INTEGER
        },
        tags: [
            'host'
        ]
    }]
})

var os = require("os");
influx.writePoints([{
    measurement: 'response_times',
    tags: {
        host: os.hostname()
    },
    fields: {
        duration: 1,
        path: "path1"
    },
}]).then(() => {
    return influx.query(`
    select * from response_times
    where host = ${Influx.escape.stringLit(os.hostname())}
    order by time desc
    limit 10
  `)
}).then(rows => {
    rows.forEach(row => console.log(`A request to ${row.path} took ${row.duration}ms`))
})