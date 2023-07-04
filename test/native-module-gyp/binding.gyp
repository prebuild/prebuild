{
  "variables": {
    "openssl_fips": ""
  },
  'targets': [
    {
      'target_name': 'native',
      'sources': [
        'src/native.cc',
      ]
    }
  ]
}
