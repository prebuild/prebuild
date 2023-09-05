{
  "variables": {
    "openssl_fips": ""
  },
  'targets': [
    {
      'target_name': 'native',
      'sources': [
        'src/native.cc',
      ],
      'xcode_settings': {
        'MACOSX_DEPLOYMENT_TARGET': '10.9'
      }
    }
  ]
}
