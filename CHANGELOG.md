# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="0.2.26"></a>
## [0.2.26](https://github.com/runem/ts-simple-type/compare/v0.2.24...v0.2.26) (2019-03-07)


### Features

* isAssignableToSimpleTypeKind now treats kind OBJECT without members as kind ANY ([b75ff9a](https://github.com/runem/ts-simple-type/commit/b75ff9a))



<a name="0.2.25"></a>
## [0.2.25](https://github.com/runem/ts-simple-type/compare/v0.2.24...v0.2.25) (2019-02-25)



<a name="0.2.24"></a>
## [0.2.24](https://github.com/runem/ts-simple-type/compare/v0.2.23...v0.2.24) (2019-02-25)


### Bug Fixes

* Allow assigning anything but 'null' and 'undefined' to the type '{}' ([5f0b097](https://github.com/runem/ts-simple-type/commit/5f0b097))



<a name="0.2.23"></a>
## [0.2.23](https://github.com/runem/ts-simple-type/compare/v0.2.22...v0.2.23) (2019-02-15)


### Bug Fixes

* Issue where isAssignableToSimpleTypeKind would fail with type 'ANY' ([38d7743](https://github.com/runem/ts-simple-type/commit/38d7743))



<a name="0.2.22"></a>
## [0.2.22](https://github.com/runem/ts-simple-type/compare/v0.2.21...v0.2.22) (2019-02-15)



<a name="0.2.21"></a>
## [0.2.21](https://github.com/runem/ts-simple-type/compare/v0.2.20...v0.2.21) (2019-02-15)


### Features

* Add function that can return the string representation of either a native typescript type or a simple type ([2019248](https://github.com/runem/ts-simple-type/commit/2019248))



<a name="0.2.20"></a>
## [0.2.20](https://github.com/runem/ts-simple-type/compare/v0.2.19...v0.2.20) (2019-02-12)


### Bug Fixes

* Fix problem where recursive types created from the cache would crash the type checking ([b62167a](https://github.com/runem/ts-simple-type/commit/b62167a))



<a name="0.2.19"></a>
## [0.2.19](https://github.com/runem/ts-simple-type/compare/v0.2.18...v0.2.19) (2019-02-11)


### Features

* Add 'Date' type for performance gains. ([a8c74de](https://github.com/runem/ts-simple-type/commit/a8c74de))



<a name="0.2.18"></a>
## [0.2.18](https://github.com/runem/ts-simple-type/compare/v0.2.17...v0.2.18) (2019-02-10)


### Features

* Add ALIAS, GENERIC and PROMISE types. Refactor and improve type checking logic especially for very complex types. ([e1e636c](https://github.com/runem/ts-simple-type/commit/e1e636c))



<a name="0.2.17"></a>
## [0.2.17](https://github.com/runem/ts-simple-type/compare/v0.2.16...v0.2.17) (2019-01-15)


### Bug Fixes

* Fix function that checks if input to functions is node or type ([3eafb07](https://github.com/runem/ts-simple-type/commit/3eafb07))



<a name="0.2.16"></a>
## 0.2.16 (2019-01-10)


### Features

* Add support for circular referenced types ([90ba8f5](https://github.com/runem/ts-simple-type/commit/90ba8f5))



<a name="0.2.15"></a>
## 0.2.15 (2019-01-10)


### Features

* Add support for circular referenced types ([90ba8f5](https://github.com/runem/ts-simple-type/commit/90ba8f5))
