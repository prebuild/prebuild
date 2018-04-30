project(native)

include_directories(${CMAKE_JS_INC})

set(SOURCES
    src/native.cc
   )
include_directories(src)

add_library(${PROJECT_NAME} SHARED ${HEADERS} ${SOURCES})
set_target_properties(${PROJECT_NAME} PROPERTIES PREFIX "" SUFFIX ".node")
target_link_libraries(${PROJECT_NAME} ${CMAKE_JS_LIB} ${EXTRA_LIBS} ${CPUID_LIB})
