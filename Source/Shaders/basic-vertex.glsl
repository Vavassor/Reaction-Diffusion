attribute vec2 position;

uniform mat4 model_view_projection;
   
void main()
{
    gl_Position = model_view_projection * vec4(position, 0.0, 1.0);
}