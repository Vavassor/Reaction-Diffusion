// Computes advection of a field through a velocity field using the implicit Euler method.

precision mediump float;

uniform float delta_time;
uniform sampler2D input_texture;
uniform vec2 texture_size;
uniform sampler2D velocity_field;

varying vec2 surface_texcoord;

vec4 sample_bilinear(sampler2D source, vec2 texel_size, vec2 sample_position)
{
    vec2 integral_part = floor(sample_position - 0.5) + 0.5;
    vec2 fractional_part = sample_position - integral_part;
    vec2 texcoord = texel_size * integral_part;

    vec4 southwest = texture2D(source, texcoord);
    vec4 northwest = texture2D(source, vec2(texcoord.x, texcoord.y + texel_size.y));
    vec4 southeast = texture2D(source, vec2(texcoord.x + texel_size.x, texcoord.y));
    vec4 northeast = texture2D(source, texcoord + texel_size);

    vec4 north = mix(northwest, northeast, fractional_part.x);
    vec4 south = mix(southwest, southeast, fractional_part.x);

    return mix(south, north, fractional_part.y);
}

void main()
{
    vec2 texel_size = 1.0 / texture_size;
    vec2 velocity = texture2D(velocity_field, surface_texcoord).xy;
    vec2 texel_velocity = -0.5 * delta_time * velocity;
    vec2 sample_position = texture_size * (surface_texcoord + texel_velocity);

    // Manually do the bilinear sample instead of using bilinear sampler
    // parameters. This allows floating-point input textures to be sampled
    // without requiring the OES_texture_float_linear extension.
    gl_FragColor = sample_bilinear(input_texture, texel_size, sample_position);
}