"use strict";
var fs = require("fs");
var path = require("path");
var uuid = require("uuid");
var firestore_1 = require("@google-cloud/firestore");
function fileExist(file) {
    try {
        fs.statSync(file);
        return true;
    }
    catch (err) {
        return false;
    }
}
/**
 * Upload the specified file to the destination.
 *
 * @param {string} file the local path of the file
 * @param {string} destination the remote path of the file
 * @param {boolean} force if true, upload even if the file exists
 * @return {Promise.<string>} download url for the file
 */
function uploadFile(bucket, file, destination, force) {
    if (destination.startsWith("/")) {
        destination = destination.substring(1);
    }
    // check if the file exists locally.
    if (fileExist(file) == false) {
        return new Promise(function (resolve, reject) {
            reject(new Error("file not found: " + file));
        });
    }
    return new Promise(function (resolve, reject) {
        // check whether the file exists or not
        bucket.file(destination).exists().then(function (exist) {
            resolve(exist[0]);
        }).catch(function (e) {
            reject(e);
        });
    }).then(function (exist) {
        // upload file
        return new Promise(function (resolve, reject) {
            if (exist == false || force) {
                bucket.upload(file, { destination: destination }).then(function (r) {
                    resolve(null);
                }).catch(function (e) {
                    reject(e);
                });
            }
            else {
                resolve(null);
            }
        });
    }).then(function () {
        // get metadata
        return new Promise(function (resolve, reject) {
            bucket.file(destination).getMetadata().then(function (metadata) {
                resolve(metadata[0]);
            }).catch(function (e) {
                reject(e);
            });
        });
    }).then(function (metadata) {
        // update "firebaseStorageDownloadTokens" metadata
        return new Promise(function (resolve, reject) {
            var token;
            if (metadata && metadata["firebaseStorageDownloadTokens"]) {
                token = metadata["firebaseStorageDownloadTokens"];
                resolve(token);
            }
            else {
                token = uuid.v4();
                metadata = metadata || {};
                metadata["firebaseStorageDownloadTokens"] = token;
                bucket.file(destination).setMetadata(metadata).then(function () {
                    resolve(token);
                }).catch(function (r) {
                    reject(r);
                });
            }
        });
    }).then(function (token) {
        // generate download url
        //var url = "https://firebasestorage.googleapis.com/v0/b/fuzoroinomori-4b4d1.appspot.com/o/public%2Fitems%2F59qsMV4SzaACDNT2Kx85.jpg?alt=media&token=7f4f487a-c24c-4d70-b5ab-f01ddf34cf75"
        var url = "https://firebasestorage.googleapis.com/v0/b/"
            + bucket.name
            + "/o/"
            + encodeURIComponent(destination)
            + "?alt=media&token="
            + token;
        return new Promise(function (resolve, reject) {
            resolve(url);
        });
    });
}
var ImageSeed = /** @class */ (function () {
    function ImageSeed(localPath, remotePath, imageOptions) {
        this.localPath = localPath;
        this.remotePath = remotePath;
        this.localPath = localPath;
        this.remotePath = remotePath;
        this.downloadURL = null;
        if (imageOptions != null) {
            this.localPath = path.join(imageOptions.localDir, localPath);
            this.remotePath = path.join(imageOptions.remoteDir, remotePath);
        }
    }
    ImageSeed.prototype.upload = function (bucket, docId) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (_this.downloadURL != null) {
                resolve(_this.downloadURL);
                return;
            }
            var fixedLocalPath = _this.localPath.replace(/\{id\}/, docId);
            var fixedRemotePath = _this.remotePath.replace(/\{id\}/, docId);
            if (fileExist(fixedLocalPath) == false) {
                reject(new Error("file not found: " + fixedLocalPath));
                return;
            }
            uploadFile(bucket, fixedLocalPath, fixedRemotePath).then(function (url) {
                _this.downloadURL = url;
                resolve(_this.downloadURL);
            }).catch(function (e) {
                reject(e);
            });
        });
    };
    return ImageSeed;
}());
var GeoPointSeed = /** @class */ (function () {
    function GeoPointSeed(latitude, longitude) {
        this.latitude = latitude;
        this.longitude = longitude;
    }
    return GeoPointSeed;
}());
var DocumentSeed = /** @class */ (function () {
    function DocumentSeed(id, data) {
        this.id = id;
        this.data = data;
    }
    return DocumentSeed;
}());
var DocumentRefSeed = /** @class */ (function () {
    function DocumentRefSeed(collection, document) {
        this.collection = collection;
        this.document = document;
    }
    return DocumentRefSeed;
}());
var SubcollectionSeed = /** @class */ (function () {
    function SubcollectionSeed(docs) {
        this.docs = docs;
    }
    return SubcollectionSeed;
}());
var DELETE = "__delete__";
var Context = /** @class */ (function () {
    function Context(doc, docRef) {
        this.doc = doc;
        this.docRef = docRef;
        this.postDocActions = [];
    }
    return Context;
}());
var CollectionSeed = /** @class */ (function () {
    function CollectionSeed(docs, collectionProvider) {
        this.docs = docs;
        this.collectionProvider = collectionProvider;
    }
    CollectionSeed.prototype.getCollection = function (firestore) {
        return this.collectionProvider(firestore);
    };
    CollectionSeed.prototype.importDocuments = function (admin) {
        var self = this;
        var firestore = admin.firestore();
        function filterDocument(context) {
            function filterObject(context, key, o) {
                var parentDocID = context.doc.id;
                var p = [];
                var filteredObject = o;
                if (o instanceof ImageSeed) {
                    var bucket = admin.storage().bucket();
                    p.push(o.upload(bucket, parentDocID).then(function (url) {
                        filteredObject = url;
                    }));
                }
                else if (o instanceof DocumentRefSeed) {
                    filteredObject = firestore.collection(o.collection).doc(o.document);
                }
                else if (o instanceof SubcollectionSeed) {
                    var subcollectionRef_1 = self.getCollection(firestore).doc(context.doc.id).collection(key);
                    var subcollection_1 = new CollectionSeed(o.docs, function () { return subcollectionRef_1; });
                    filteredObject = DELETE;
                    context.postDocActions.push(function () { return subcollection_1.importDocuments(admin); });
                }
                else if (o instanceof GeoPointSeed) {
                    filteredObject = new firestore_1.GeoPoint(o.latitude, o.longitude);
                }
                else if (o instanceof Date) {
                    filteredObject = firestore_1.Timestamp.fromDate(o);
                }
                else if (o instanceof firestore_1.Timestamp) {
                    filteredObject = o;
                }
                else if (o instanceof Array || o instanceof Object) {
                    filteredObject = o instanceof Array ? Array(o.length) : {};
                    var _loop_1 = function (i) {
                        p.push(filterObject(context, i, o[i]).then(function (filteredChild) {
                            if (filteredChild !== DELETE) {
                                filteredObject[i] = filteredChild;
                            }
                        }));
                    };
                    for (var i in o) {
                        _loop_1(i);
                    }
                }
                return Promise.all(p).then(function () {
                    return new Promise(function (resolve, reject) {
                        resolve(filteredObject);
                    });
                });
            }
            return new Promise(function (resolve, reject) {
                var doc = context.doc;
                var id = doc.id;
                return filterObject(context, null, doc.data).then(function (filteredData) {
                    resolve(new DocumentSeed(id, filteredData));
                }).catch(function (e) {
                    reject(e);
                });
            });
        }
        var p = [];
        var collection = this.getCollection(firestore);
        this.docs.forEach(function (d) {
            var docRef = collection.doc(d.id);
            var context = new Context(d, docRef);
            p.push(filterDocument(context).then(function (filteredDoc) {
                return docRef.set(filteredDoc.data).then(function () {
                    var postDocResults = [];
                    context.postDocActions.forEach(function (postDocAction) {
                        postDocResults.push(postDocAction());
                    });
                    return Promise.all(postDocResults);
                });
            }));
        });
        return Promise.all(p);
    };
    return CollectionSeed;
}());
module.exports = {
    /**
     * Create document.
     *
     * @param id document id.
     * @param data document data.
     */
    doc: function (id, data) {
        return new DocumentSeed(id, data);
    },
    /**
     * Create document reference.
     *
     * @param collection collection path
     * @param document document id.  if omitted, the last path component of the '/' separated path will be used.
     */
    docRef: function (collection, document) {
        if (document === undefined || document === null) {
            var s = collection.split("/");
            if (s.length != 2) {
                throw new Error("unsupported format collection: " + collection);
            }
            collection = s[0];
            document = s[1];
        }
        return new DocumentRefSeed(collection, document);
    },
    /**
     * Create image.  The image file will be upload to Cloud Storage.
     *
     * @param localPath file to upload.  relative path from {@link ImageOptions#localDir}.
     * @param remotePath upload path on CloudStorage. relative path from {@link ImageOptions#remoteDir}
     * @param imageOptions options
     */
    image: function (localPath, remotePath, imageOptions) {
        return new ImageSeed(localPath, remotePath, imageOptions);
    },
    /**
     * for compatibility.
     *
     * You don't need to use this method.
     * You can simply pass plain javascript object to image() method.
     */
    imageOptions: function (localDir, remoteDir) {
        return { localDir: localDir, remoteDir: remoteDir };
    },
    geoPoint: function (latitude, longitude) {
        return new GeoPointSeed(latitude, longitude);
    },
    collection: function (name, docs) {
        return new CollectionSeed(docs, function (firestore) { return firestore.collection(name); });
    },
    subcollection: function (docs) {
        return new SubcollectionSeed(docs);
    },
    importCollections: function (admin, collections) {
        return Promise.all(collections.map(function (collection) { return collection.importDocuments(admin); }));
    }
};
