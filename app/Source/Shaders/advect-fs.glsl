// Computes advection of a field through a velocity field using the implicit Euler method.

precision mediump float;

uniform float delta_time;
uniform sampler2D input_texture;
uniform sampler2D velocity_field;

varying vec2 surface_texcoord;

void main()
{
    vec2 velocity = texture2D(velocity_field, surface_texcoord).xy;
    vec2 prior_texcoord = surface_texcoord - (0.5 * delta_time * velocity);
    gl_FragColor = texture2D(input_texture, prior_texcoord);
}