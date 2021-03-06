const env = process.env.NODE_ENV || 'development';
const config = require('../../knexfile')[env];
const db = require('knex')(config);

const getBreweries = (req, res) => {
  const allowedParams = ['name', 'state', 'city'];

  db('breweries')
    .modify((query) => {
      for (const param of allowedParams) {
        if (req.query[param]) {
          return query.where(param, req.query[param]);
        }
      }
      return null;
    })
    .select()
    .then((breweries) => {
      return res.status(200).json(breweries);
    })
    .catch(error => res.status(404).json({ error }));
};

const postBreweries = (req, res) => {
  const newBrewery = req.body;

  for (const requiredParam of ['name']) {
    if (!newBrewery[requiredParam]) {
      return res.status(422).json({
        error: `Missing required parameter ${requiredParam}`,
      });
    }
  }

  db('breweries').insert(newBrewery, 'id')
    .then(brewery => res.status(201).json({ id: brewery[0] }))
    .catch(error => res.status(500).json({ error }));
};

const deleteBrewery = (req, res) => {
  const id = req.params.id;

  db('brews')
    .where('brewery_id', id)
    .del()
    .returning('*')
    .then((brews) => {
      db('breweries')
        .where('id', id)
        .del()
        .returning('*')
        .then((brewery) => {
          if (brewery.length) {
            return res.status(200).json({
              brewery: brewery[0],
              brews,
              message: 'Successful delete',
            });
          } else {
            return res.status(404).json({
              error: 'Resource does not exist',
            });
          }
        });
    })
    .catch(error => res.status(501).json({ error }));
};

const updateBrewery = (req, res) => {
  const optionalParams = ['name', 'city', 'state'];
  const errors = Object.keys(req.body).filter(e => !optionalParams.includes(e));

  if (errors.length) {
    return res.status(400).json({
      error: `Invalid parameter(s): ${errors}`,
    });
  }

  const { id } = req.params;

  db('breweries')
    .where('id', id)
    .update(req.body, '*')
    .then((brewery) => {
      return res.status(200).json(brewery[0]);
    })
    .catch(error => res.status(500).json({ error }));
};

module.exports = {
  getBreweries,
  postBreweries,
  deleteBrewery,
  updateBrewery,
};
