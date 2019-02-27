const rp = require('request-promise')
const XLSX = require('xlsx')
const utils = require('./utils')

function processOrganisme (props) {
  return {
    nom: props.Nom,
    pivotLocal: 'mds',
    id: props.ID,
    adresses: [processAddress(props)],
    horaires: utils.processOpeningHours(props.Horaires),
    telephone: props.Tel,
    zonage: { communes: props.Zonage.split(';') },
    raw: props
  }
}

function processAddress (organisme) {
  let address = {
    codePostal: organisme.CP,
    commune: organisme.Commune,
    lignes: [organisme.Adresse],
    type: 'physique'
  }

  if (organisme.Comp_Adr && organisme.Comp_Adr.length) {
    address.lignes.unshift(organisme.Comp_Adr)
  }

  return address
}

function importOrganismes () {
  return rp({
    uri: 'https://static.data.gouv.fr/resources/maisons-departementales-des-solidarites/20181217-100752/mds-seine-et-marne.xlsx',
    method: 'GET',
    encoding: 'binary'
  })
    .then(data => XLSX.read(data, { type: 'binary' }))
    .then(workbook => workbook.Sheets[workbook.SheetNames[0]])
    .then(XLSX.utils.sheet_to_json)
    .map(processOrganisme)
    .map(props => { return { properties: props } })
}

const enrich = require('../enrich')
function addOrganismes (dataset) {
  return enrich.addOrganismes(dataset, importOrganismes(), '77')
}

module.exports = {
  addOrganismes
}