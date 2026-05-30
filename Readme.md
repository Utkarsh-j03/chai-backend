# chai aur backend series

This is a backend project with javascript

- [Model link](https://app.eraser.io/workspace/YtPqZ1VogxGy1jzIDkzj)

# DEBUGGIN ERRORS

1. error while configuring cloudinary:
   -cloudinary was requesting env variables before env variables were configged
   -solved by configging cloudinary in index.js after config of env, so it does not config cloudinary before loading up env

2. if coverImage not uploaded, error :
   -we were fetching coverImage path as follows
   "const coverImageLocalPath = req.files?.coverImage[0]?.path;"
   which was fetching errors as coverImage may be undefined and we are fetching properties of undefined( undefined[0] )

   -hence we only access further if all properties before are defined
   "if (
   req.files &&
   Array.isArray(req.files.coverImage) &&
   req.files.coverImage.length > 0
   ) {
   coverImageLocalPath = req.files.coverImage[0].path;
   }
   "
