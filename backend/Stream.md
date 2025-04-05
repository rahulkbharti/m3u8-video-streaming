### feat: Add signed URL support with caching for HLS segments and assets

- Implemented SAS URL generation with expiry for video assets and segments
- Cached signed URLs to avoid regenerating them within their valid duration
- Automatically clean expired cache entries every minute
- Updated routes to serve .m3u8 playlists with signed .ts segment URLs
- Ensured security by avoiding direct access to blobs without signing
