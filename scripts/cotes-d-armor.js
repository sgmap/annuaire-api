const enrich = require('../enrich')
const rp = require('request-promise')
const utils = require('./utils')

function processOrganisme (organisme) {
  if (!organisme.Nom) {
    return { horaires: [] }
  }

  return {
    nom: organisme.Nom,
    pivotLocal: 'mds',
    id: organisme.id__,
    adresses: [ processAddress(organisme) ],
    horaires: utils.processOpeningHours(organisme.Horaires),
    telephone: organisme.Tel,
    zonage: {
      communes: [ organisme.Code_INSEE + ' ' + organisme.Commune ]
    },
    raw: organisme
  }
}

function processAddress (organisme) {
  let address = {
    codePostal: organisme.CP,
    commune: organisme.Commune,
    lignes: [ organisme.Adresse ],
    type: 'physique'
  }

  if (organisme.Comp_Adr && organisme.Comp_Adr.length) {
    address.lignes.unshift(organisme.Comp_Adr)
  }

  return address
}

function filterOrganismes (organismes) {
  return organismes.filter(organisme => organisme.horaires.length)
}

function importOrganismes () {
  return rp({
    uri: 'http://datarmor.cotesdarmor.fr/dataserver/cg22/data/site_acceuil?&$format=json',
    json: true
  }).then(d => d.d.results)
    .then(d => d.map(processOrganisme))
    .then(filterOrganismes)
    .then(d => d.map(props => { return { properties: props } }))
    .catch(e => {
      console.error(e)
      return []
    })
}

function addOrganismes (dataset) {
  return enrich.addOrganismes(dataset, importOrganismes(), '22')
}

module.exports = {
  addOrganismes
}
