// Computes advection of a field through a velocity field using the implicit Euler method.

precision mediump float;

uniform float delta_time;
uniform sampler2D input_texture;
uniform vec2 texture_size;
uniform sampler2D velocity_field;

varying vec2 surface_texcoord;

void main()
{
    vec2 texel_size = 1.0 / texture_size;

    vec2 velocity = texture2D(velocity_field, surface_texcoord).xy;
    vec2 texel_velocity = -0.5 * delta_time * velocity * texture_size;
    vec2 integral_part = floor(texel_velocity);
    vec2 fractional_part = texel_velocity - integral_part;
    vec2 prior_texcoord = surface_texcoord + (texel_size * integral_part);

    vec4 southwest = texture2D(input_texture, prior_texcoord);
    vec4 northwest = texture2D(input_texture, vec2(prior_texcoord.x, prior_texcoord.y + texel_size.y));
    vec4 southeast = texture2D(input_texture, vec2(prior_texcoord.x + texel_size.x, prior_texcoord.y));
    vec4 northeast = texture2D(input_texture, prior_texcoord + texel_size);

    vec4 north = mix(northwest, northeast, fractional_part.x);
    vec4 south = mix(southwest, southeast, fractional_part.x);

    gl_FragColor = mix(south, north, fractional_part.y);
}