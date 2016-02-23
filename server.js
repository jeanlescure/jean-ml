require('dotenv').config();

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var ShortUID = require('short-uid');
var uid = new ShortUID();
var metafetch = require('metafetch');
var ejs = require('ejs');
var _ = require('lodash');

var fs = require('fs');
var metaItemString = fs.readFileSync('./views/metaItem.ejs', 'utf-8');

var knex_config = require('./knexfile');
var knex = require('knex')(knex_config[process.env.NODE_ENV]);
var bookshelf = require('bookshelf')(knex);

var TinyURL = bookshelf.Model.extend({
  tableName: process.env.DB_TABLE
});

app.use( bodyParser.json() );
app.use( bodyParser.urlencoded({
  extended: true
}) );

app.set('view engine', 'ejs');

app.use(express.static('public'));

app.get('/', function (req, res) {
  TinyURL.query(function(qb){
    qb.orderBy('created_at','DESC'); 
  }).fetchAll().then(function(urls){
    var url_list = urls.toJSON();

    var meta_list = _.map(url_list, function(url){
      return _.assign({tiny_url: tinify(url.id), destination_url: url.destination_url, view_count: url.view_count}, url.meta_json);
    });

    res.render('index', {
      title: 'Jean.ml Tiny URL',
      meta_list: meta_list.reverse(),
      access_token: uid.randomUUID(8)
    });
  });
});

app.post('/create', function (req, res) {
  if (!(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/).test(req.body.url)) {
    res.status(500).send(_.sample(nope));
    return;
  }

  if (req.body.access_token !== process.env.KEY) {
    res.status(500).send(_.sample(nope));
    return;
  }

  metafetch.fetch(req.body.url, {
    flags: {
      images: false,
      links: false
    },
    http: {
      timeout: 30000
    }
  }, function (err, meta) {
    new TinyURL().save({
      id: uid.randomUUID(6),
      destination_url: req.body.url,
      meta_json: JSON.stringify(meta)
    },
    {
      method: 'insert'
    }).then(function(url) {
      var id = url.get('id');
      var destination_url = url.get('destination_url');
      var meta_json = url.get('meta_json');
      var view_count = url.get('view_count');

      meta_json = _.assign({tiny_url: tinify(id), destination_url: destination_url, view_count: view_count}, JSON.parse(meta_json));
      var result = {meta_item: ejs.render(metaItemString, {meta_json: meta_json})};

      res.status(200).send(result);
    }).catch(function(err){
      console.log(err);
      res.status(500).send(_.sample(nope));
    });
  });
});

app.get('/:id', function (req, res) {
  if (req.params.id){}
    new TinyURL({'id': req.params.id})
    .fetch()
    .then(function(url) {
      var view_count = url.get('view_count');
      var destination_url = url.get('destination_url');

      url.set('view_count', view_count + 1);
      url.save().then(function(u) {
        res.redirect(302, destination_url);
      });
    });
  }

  next();
});

app.listen(process.env.SERVER_PORT, function () {
  console.log('Server listening on port '+ process.env.SERVER_PORT +'!');
});

function tinify(id) {
  return 'http://jean.ml/' + id;
}

var nope = [
  'just, no',
  'not gonna happen',
  'ha!... no',
  'there\'s a greater chance of a roll of sushi randomly popping into existance',
  'negative',
  'you\'re kidding, right?',
  '"never" is a bit excessive, so I\'ll just say "no"',
  'I cannot oblige',
  'goo.gl might work for what you need',
  '"no" means "definitely not"'
];