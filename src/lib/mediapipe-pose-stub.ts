// @tensorflow-models/pose-detection statically imports `Pose` from
// @mediapipe/pose to support the optional BlazePose/MediaPipe runtime.
// We only ever use the MoveNet runtime, and @mediapipe/pose ships as a
// legacy UMD-style script (it assigns `window.Pose` rather than a real
// ESM export), which breaks static bundling. This stub satisfies the
// import without pulling in that dead code path.
export const Pose = undefined
