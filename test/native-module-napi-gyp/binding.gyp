{
  'targets': [
    {
      'target_name': 'native',
      'sources': [
        'src/native.cc',
      ],
      'defines': [
        'NAPI_VERSION=<(napi_build_version)',
      ]
    }
  ]
}
