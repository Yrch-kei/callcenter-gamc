import api from './api'
import { MOCK_COMPANIES } from './mockData'

let _categories = null
let _companies  = null

const catalogService = {
  getCategories: async () => {
    if (_categories) return _categories
    _categories = await api.get('/categories').then((r) => r.data)
    return _categories
  },

  getCompanies: async () => {
    if (_companies) return _companies
    _companies = MOCK_COMPANIES
    return _companies
  },

  clearCache: () => {
    _categories = null
    _companies  = null
  },
}

export default catalogService
