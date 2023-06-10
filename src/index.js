import MD5 from "./md5"
import Flow from "./flow"

export function version() {
    return "2.0.1";
}

export function build(opts) {
    // default opts
    opts = opts || {};
    
    
    opts.action             = opts.action || "";
    opts.headers            = opts.headers || {};
    opts.accessToken        = opts.accessToken || "";
    opts.lineID             = opts.lineID || null;
    opts.folderID           = opts.folderID || 0;
    opts.assignBrowseFile   = opts.assignBrowseFile || [];
    opts.assignBrowseFolder = opts.assignBrowseFolder || [];
    opts.assignDrop         = opts.assignDrop || Element;
    opts.fileParameterName  = opts.fileParameterName || "media";
    opts.chunkSize          = opts.chunkSize || 1024 * 1024;
    opts.successStatuses    = opts.successStatuses || [200];
    opts.maxChunkRetries    = opts.maxChunkRetries || 3;
    opts.singleFile         = opts.singleFile || false;
    opts.fileTypes          = opts.fileTypes || ["avi","mp4","m4v","webm","flv","wmv","mkv","mpeg","mpg","f4v","mov","vob","ts", "aac","wav","wave","mp3","aiff","wma","opus","flac","ogg","m4a"];
    
    // console.log(opts);

    var f = new Flow({
        target: opts.action,
        headers: opts.headers,
        withCredentials: true,
        fileTypes: opts.fileTypes,
        fileParameterName: opts.fileParameterName,
        chunkSize: opts.chunkSize,
        successStatuses: opts.successStatuses,
        maxChunkRetries: opts.maxChunkRetries,
        singleFile: opts.singleFile,
        progressCallbacksInterval: 300,
        speedSmoothingFactor: 0.5,
        initFileFn: function(entry) {
            let pwn = (entry.relativePath.substring(0, entry.relativePath.lastIndexOf("/")));
            entry._FID = MD5(pwn);
            entry._rawFID = pwn;
            entry.getName = function () {
                return entry.name.replace(/\.[^/.]+$/, "");
            }
            
            entry.query = {"folder_id": opts.folderID, "line_id": opts.lineID};
            if(typeof opts.query != "undefined" && typeof opts.query == "object") {
                entry.query = Object.assign(entry.query, opts.query);
            }
            typeof opts.initFileFn != "undefined" && opts.initFileFn(entry);
        },
        query: function(file) {
            return file.query;
        },
        // preprocess: function(f) {
        //     console.log("preprocess:",f);
        // },
        // allowDuplicateUploads: true,
    });

    if(f.support) {
        f.assignBrowse(opts.assignBrowseFile,false);
        f.assignBrowse(opts.assignBrowseFolder, true);
        f.assignDrop(opts.assignDrop);
        typeof opts.onDragOver != "undefined" && ( opts.assignDrop.addEventListener("dragover", opts.onDragOver, false),  opts.assignDrop.addEventListener("dragenter", opts.onDragOver, false));
        typeof opts.onDragLeave != "undefined" && ( opts.assignDrop.addEventListener("dragleave", opts.onDragLeave, false),  opts.assignDrop.addEventListener("drop", opts.onDragLeave, false));

        typeof opts.onInput != "undefined" && f.on("filesSubmitted",function(files) {
            // check files types
            for(let i in files) {
                let ex = files[i].getExtension();
                if( !ex || ex == "" || opts.fileTypes.indexOf(ex) == -1 ) {
                    files[i].cancel();
                }
            }
            
            // return inputs
            setTimeout(function(){
                opts.onInput({
                    files: f.files,
                    folders: f.folders,
                }, f);
            },100);
        });

        typeof opts.onProgress != "undefined" && f.on("fileProgress",function(files, chunk) {
            opts.onProgress(files, chunk);
        });

        typeof opts.onSuccess != "undefined" && f.on("fileSuccess",function(file, message, chunk) {
            message = (message && message != "") ? JSON.parse(message) : message;
            opts.onSuccess(file, message, chunk);
        });

        typeof opts.onFileError != "undefined" && f.on("fileError",function(file, message, chunk) {
            message = (message && message != "") ? JSON.parse(message) : message;
            opts.onFileError(file, message, chunk);
        });
        
        // flow.on('uploadStart', function(folders){

        // });

    } else {
        typeof opts.unSupport != "undefined" && opts.unSupport();
    }

    return f;
}