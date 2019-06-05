uniform mat4 model_view_projection;

attribute vec2 position;
attribute vec2 texcoord;

varying vec2 shape_texcoord;

void main()
{
    gl_Position = model_view_projection * vec4(position, 0.0, 1.0);
    shape_texcoord = texcoord;
}